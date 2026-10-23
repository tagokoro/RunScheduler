require "digest"

class WeeklyPlanService
  class Error < StandardError
    attr_reader :status

    def initialize(message, status: :unprocessable_entity)
      super(message)
      @status = status
    end
  end

  def initialize(user)
    @user = user
  end

  MAX_DAYS = 366
  CHUNK_DAYS = 28
  MAX_TOKEN_BYTES = 2_000_000

  def propose(token = nil)
    payload = token.present? ? verified_payload(token) : initial_payload
    raise Error, "日付が変わりました。もう一度提案してください。" if Date.iso8601(payload.fetch("start_date")) < Date.current
    unless profile_digest(user.profile.reload.attributes) == payload["profile_digest"]
      raise Error, "プロフィールが変更されています。もう一度提案してください。"
    end
    profile = Profile.new(payload.fetch("profile"))
    remaining = payload.fetch("limits").keys.drop(payload.fetch("records").length)
    dates = remaining.first(CHUNK_DAYS)
    training_dates = dates.reject { |date| date == payload.fetch("end_date") }
    if training_dates.any?
      result = ChatgptService.new.generate_training_records(
        profile: profile, days: training_dates.length,
        training_days: Profile::WEEKDAYS.select { |day| profile.weekly_availability[day].positive? },
        available_minutes_by_date: payload.fetch("limits").slice(*training_dates),
        recent_activities: payload.fetch("recent"), preceding_plans: payload.fetch("records").last(14),
        start_date: Date.iso8601(training_dates.first)
      )
      records = result.fetch("training_records")
      validate_records!(records, payload.fetch("limits").slice(*training_dates))
      payload["records"].concat(records.sort_by { |record| record.fetch("date") })
    end
    if dates.include?(payload.fetch("end_date"))
      payload["records"] << race_record(profile)
    end
    proposal_response(payload)
  end

  def commit(token)
    payload = verified_payload(token)
    unless payload.fetch("records").length == payload.fetch("limits").length
      raise Error, "大会までの提案が揃っていません。続きを生成してください。"
    end
    dates = Date.iso8601(payload.fetch("start_date"))..Date.iso8601(payload.fetch("end_date"))
    user.with_lock do
      unless TrainingPlanCommit.exists?(user: user, proposal_id: payload.fetch("id"))
        raise Error.new("日付が変わりました。もう一度提案してください。", status: :conflict) if dates.first < Date.current
        unless profile_digest(user.profile.reload.attributes) == payload["profile_digest"]
          raise Error.new("プロフィールが変更されています。もう一度提案してください。", status: :conflict)
        end
        existing = records_for(dates).lock.index_by { |record| record.date.to_s }
        payload.fetch("records").each do |plan|
          record = existing[plan.fetch("date")]
          next if record&.activity_recorded?
          unless fingerprint(record) == payload.fetch("baseline")[plan.fetch("date")]
            raise Error.new("確認後に予定が変更されました。もう一度提案して確認してください。", status: :conflict)
          end
          record ||= user.training_records.build(date: plan.fetch("date"))
          record.assign_attributes(plan.slice("training_type", "description", "distance_km", "duration_minutes", "pace", "notes"))
          record.completed = false
          record.save!
        end
        TrainingPlanCommit.create!(user: user, proposal_id: payload.fetch("id"), start_date: dates.first, end_date: dates.last)
      end
      records_for(dates).map(&:api_attributes)
    end
  end

  private

  def initial_payload
    start_date = Date.current
    user.with_lock do
      profile = user.profile&.reload
      raise Error, "プロフィールを登録してください。" unless profile
      raise Error, "普段の練習スケジュールを7曜日すべて登録してください。" unless profile.schedule_configured?
      raise Error, "少なくとも1曜日に練習できる時間を設定してください。" unless profile.weekly_availability.values.any?(&:positive?)
      raise Error, "大会日を更新してから提案してください。" if profile.race_date < start_date
      raise Error, "大会日は今日から366日以内に設定してください。" if (profile.race_date - start_date).to_i >= MAX_DAYS
      dates = (start_date..profile.race_date).to_a
      existing = records_for(dates).index_by { |record| record.date.to_s }
      recent = user.training_records.where(completed: true, date: (start_date - 27)..start_date).order(:date).map do |record|
        { date: record.date, training_type: record.training_type, distance_km: record.actual_distance_km || record.distance_km,
          duration_minutes: record.actual_duration_minutes || record.duration_minutes, feedback: record.feedback.to_s.first(2000) }
      end
      { "id" => SecureRandom.uuid, "user_id" => user.id, "start_date" => start_date.to_s, "end_date" => profile.race_date.to_s,
        "expires_at" => 1.hour.from_now.iso8601, "profile" => profile.attributes, "profile_digest" => profile_digest(profile.attributes),
        "limits" => dates.to_h { |date| [ date.to_s, date == profile.race_date ? nil : profile.available_minutes(date) ] },
        "baseline" => dates.to_h { |date| [ date.to_s, fingerprint(existing[date.to_s]) ] },
        "retained" => existing.values.select(&:activity_recorded?).to_h { |record| [ record.date.to_s, record.api_attributes ] },
        "recent" => recent, "records" => [] }
    end
  end

  def race_record(profile)
    { "date" => profile.race_date.to_s, "training_type" => "race", "description" => "目標レース当日",
      "duration_minutes" => (profile.target_time_seconds / 60.0).ceil,
      "distance_km" => { "5k" => 5, "half" => 21.0975, "full" => 42.195 }.fetch(profile.target_race_type).round(2),
      "pace" => nil, "notes" => "大会の予定です。所要時間は目標タイムで、普段の練習時間の上限は適用しません。" }
  end

  def proposal_response(payload)
    token = verifier.generate(payload, purpose: "race-plan", expires_at: Time.iso8601(payload.fetch("expires_at")))
    raise Error, "提案内容が長すぎます。再提案してください。" if token.bytesize > MAX_TOKEN_BYTES
    {
      proposal_token: token, start_date: payload.fetch("start_date"), end_date: payload.fetch("end_date"),
      expires_at: payload.fetch("expires_at"), complete: payload.fetch("records").length == payload.fetch("limits").length,
      days: payload.fetch("records").map do |record|
        date = record.fetch("date")
        retained = payload.fetch("retained")[date]
        { date: date, available_minutes: payload.fetch("limits")[date],
          action: retained ? "retain" : (payload.fetch("baseline")[date] ? "replace" : "create"), record: retained || record }
      end,
      recent_activity_count: payload.fetch("recent").length
    }
  end

  def verified_payload(token)
    payload = verifier.verified(token.to_s, purpose: "race-plan") if token.is_a?(String) && token.bytesize <= MAX_TOKEN_BYTES
    unless payload.is_a?(Hash) && payload["user_id"] == user.id
      raise Error, "提案が無効または期限切れです。もう一度提案してください。"
    end
    payload
  end

  attr_reader :user

  def verifier
    Rails.application.message_verifier("weekly-plan-proposal-v1")
  end

  def records_for(dates)
    user.training_records.where(date: dates).order(:date)
  end

  def fingerprint(record)
    record && Digest::SHA256.hexdigest(record.attributes.to_json)
  end

  def profile_digest(attributes)
    Digest::SHA256.hexdigest(attributes.except("created_at", "updated_at").to_json)
  end

  def validate_records!(records, limits)
    unless records.is_a?(Array) && records.all? { |record| record.is_a?(Hash) && record["date"].is_a?(String) } && records.length == limits.length && records.map { |record| record["date"] }.sort == limits.keys.sort
      raise Error, "対象期間の提案を確認できませんでした。再提案してください。"
    end
    records.each do |record|
      limit = limits.fetch(record.fetch("date"))
      duration = record["duration_minutes"]
      rest = record["training_type"] == "rest"
      valid_duration = rest ? (duration.nil? || duration == 0) : (duration.is_a?(Integer) && duration.positive? && duration <= limit)
      distance = record["distance_km"]
      unless valid_duration && (limit.positive? || rest) && record["training_type"].is_a?(String) && record["training_type"].present? && record["training_type"].length <= 50 &&
          record["description"].is_a?(String) && record["description"].present? && record["description"].length <= 2000 &&
          (record["notes"].nil? || (record["notes"].is_a?(String) && record["notes"].length <= 1000)) &&
          (record["pace"].nil? || (record["pace"].is_a?(String) && record["pace"].length <= 100)) && (distance.nil? || (distance.is_a?(Numeric) && distance >= 0 && distance <= 999.99)) &&
          (!rest || distance.nil? || distance == 0)
        raise Error, "利用可能時間を超える、または不正な提案です。再提案してください。"
      end
    end
  end
end
