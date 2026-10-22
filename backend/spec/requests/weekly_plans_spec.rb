require "swagger_helper"

RSpec.describe "Weekly plan proposals", type: :request do
  include ActiveSupport::Testing::TimeHelpers
  let(:user) { create(:user) }
  let(:schedule) { Profile::WEEKDAYS.index_with { |day| day == "sunday" ? 0 : 45 } }
  let!(:profile) { create(:profile, user: user, weekly_availability: schedule, race_date: Date.current + 6) }
  let(:ai) { instance_double(ChatgptService) }
  let(:plans) do
    (Date.current...profile.race_date).map do |date|
      rest = profile.available_minutes(date).zero?
      { "date" => date.to_s, "training_type" => rest ? "rest" : "easy_run", "description" => rest ? "休養" : "無理のないラン",
        "distance_km" => rest ? nil : 3, "duration_minutes" => rest ? nil : 20, "pace" => nil,
        "notes" => "時間を使い切る必要はありません", "completed" => false, "feedback" => nil }
    end
  end
  before do
    sign_in_with_google(user)
    allow(ChatgptService).to receive(:new).and_return(ai)
    allow(ai).to receive(:generate_training_records).and_return("training_records" => plans)
  end
  after { reset_google_auth; travel_back }

  def propose
    post "/weekly_plans/propose", headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    JSON.parse(response.body)
  end

  def save(token)
    post "/weekly_plans/save", params: { proposal_token: token }, headers: csrf_headers, as: :json
  end

  path "/weekly_plans/propose" do
    post "Propose through race day in resumable chunks without changing the database" do
      tags "WeeklyPlans"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, required: false, schema: { type: :object, properties: {
        proposal_token: { type: :string, description: "Omit to start; send the previous token to generate the next chunk. Save only when complete is true." }
      } }
      let(:payload) { {} }
      parameter name: "X-CSRF-Token", in: :header, required: true, schema: { type: :string }
      let(:"X-CSRF-Token") { @csrf_token }
      response "200", "proposal to review (expires after one hour)" do
        schema type: :object, required: %w[proposal_token complete start_date end_date expires_at days recent_activity_count], properties: {
          proposal_token: { type: :string }, complete: { type: :boolean }, start_date: { type: :string, format: :date }, end_date: { type: :string, format: :date },
          expires_at: { type: :string, format: :"date-time" }, recent_activity_count: { type: :integer },
          days: { type: :array, minItems: 1, maxItems: 366, items: { type: :object, required: %w[date available_minutes action record], properties: {
            date: { type: :string, format: :date }, available_minutes: { type: :integer, nullable: true, minimum: 0, maximum: 1440 },
            action: { type: :string, enum: %w[create replace retain] }, record: { "$ref" => "#/components/schemas/ProposedTrainingRecord" }
          } } }
        }
        run_test! do
          expect(user.training_records.count).to eq(0)
          expect(TrainingPlanCommit.count).to eq(0)
        end
      end
      response "401", "authentication required" do
        before { delete "/logout", headers: csrf_headers }
        run_test!
      end
      response "403", "CSRF token or origin rejected" do
        let(:"X-CSRF-Token") { "invalid" }
        run_test!
      end
      response "422", "schedule incomplete or proposal exceeds the daily time limit" do
        before { profile.update!(weekly_availability: {}) }
        run_test!
      end
    end
  end

  path "/weekly_plans/save" do
    post "Save a reviewed proposal atomically and idempotently" do
      tags "WeeklyPlans"
      consumes "application/json"
      produces "application/json"
      parameter name: "X-CSRF-Token", in: :header, required: true, schema: { type: :string }
      let(:"X-CSRF-Token") { @csrf_token }
      parameter name: :payload, in: :body, schema: { type: :object, required: [ "proposal_token" ], properties: { proposal_token: { type: :string } } }
      let(:payload) { { proposal_token: WeeklyPlanService.new(user).propose[:proposal_token] } }
      response "200", "saved; repeated requests do not reapply the plan" do
        schema type: :object, required: [ "training_records" ], properties: { training_records: { type: :array, items: { "$ref" => "#/components/schemas/SavedTrainingRecord" } } }
        run_test!
      end
      response "401", "authentication required" do
        before { delete "/logout", headers: csrf_headers }
        run_test!
      end
      response "403", "CSRF token or origin rejected" do
        let(:"X-CSRF-Token") { "invalid" }
        run_test!
      end
      response "422", "invalid, expired or another user's proposal" do
        let(:payload) { { proposal_token: "invalid" } }
        run_test!
      end
      response "409", "profile, date or uncompleted plan changed; propose again" do
        let(:payload) do
          proposal = WeeklyPlanService.new(user).propose
          profile.update!(weight: 65)
          { proposal_token: proposal[:proposal_token] }
        end
        run_test!
      end
    end
  end

  it "does not modify profiles, records or commit history when proposing, re-proposing or cancelling locally" do
    existing = user.training_records.create!(date: Date.current, training_type: "long_run", duration_minutes: 40)
    snapshot = [ profile.reload.attributes, existing.reload.attributes, TrainingPlanCommit.count ]
    first = propose
    expect(first["days"].first["action"]).to eq("replace")
    second = propose
    expect(first["proposal_token"]).not_to eq(second["proposal_token"])
    expect([ profile.reload.attributes, existing.reload.attributes, TrainingPlanCommit.count ]).to eq(snapshot)
    expect(user.training_records.count).to eq(1)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "does not call AI when any weekday is unset, every day is rest, or the race date is stale" do
    expect(ai).not_to receive(:generate_training_records)
    [ {}, schedule.merge("monday" => nil), Profile::WEEKDAYS.index_with { 0 } ].each do |settings|
      profile.update!(weekly_availability: settings)
      post "/weekly_plans/propose", headers: csrf_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
    profile.update_columns(weekly_availability: schedule, race_date: Date.yesterday)
    post "/weekly_plans/propose", headers: csrf_headers, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "enforces time limits, explicit rest days, integer duration, distance, and seven unique dates" do
    original = Marshal.load(Marshal.dump(plans))
    [ -> { plans.find { |row| row["training_type"] != "rest" }["duration_minutes"] = 46 },
      -> { plans.find { |row| row["training_type"] == "rest" }.merge!("training_type" => "easy_run", "duration_minutes" => 10) },
      -> { plans.first["duration_minutes"] = 1.5 }, -> { plans.first["distance_km"] = -1 },
      -> { plans.last["date"] = plans.first["date"] }, -> { plans.pop } ].each do |invalidate|
      plans.replace(Marshal.load(Marshal.dump(original)))
      invalidate.call
      post "/weekly_plans/propose", headers: csrf_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(user.training_records.count).to eq(0)
    end
  end

  it "allows a rest day even when time is available and never requires using the whole limit" do
    plans.first.merge!("training_type" => "rest", "duration_minutes" => nil, "distance_km" => nil)
    result = propose
    expect(result["days"].map { |day| day["available_minutes"] }).to include(45, 0)
    save(result["proposal_token"])
    expect(response).to have_http_status(:ok)
    expect(user.training_records.count).to eq(7)
  end

  it "keeps completed records and activity/feedback including records completed after the preview" do
    existing = user.training_records.create!(date: Date.current, training_type: "tempo", completed: true,
      actual_distance_km: 4, actual_duration_minutes: 25, feedback: "疲労がある")
    result = propose
    expect(result["days"].first["action"]).to eq("retain")
    original = existing.reload.attributes
    save(result["proposal_token"])
    expect(response).to have_http_status(:ok)
    expect(existing.reload.attributes).to eq(original)
    expect(user.training_records.count).to eq(7)
  end

  it "preserves actuals even if completion was cancelled" do
    existing = user.training_records.create!(date: Date.current, training_type: "tempo", completed: false, actual_distance_km: 4, feedback: "保持")
    result = propose
    original = existing.attributes
    save(result["proposal_token"])
    expect(response).to have_http_status(:ok)
    expect(existing.reload.attributes).to eq(original)
  end

  it "returns a conflict and rolls back the entire save if any uncompleted day changed" do
    result = propose
    user.training_records.create!(date: Date.current + 5, training_type: "tempo", duration_minutes: 30)
    save(result["proposal_token"])
    expect(response).to have_http_status(:conflict)
    expect(user.training_records.count).to eq(1)
    expect(TrainingPlanCommit.count).to eq(0)
  end

  it "preserves a newly completed activity instead of treating it as an overwrite conflict" do
    result = propose
    activity = user.training_records.create!(date: Date.current, training_type: "tempo", completed: true, feedback: "記録済み")
    save(result["proposal_token"])
    expect(response).to have_http_status(:ok)
    expect(activity.reload.feedback).to eq("記録済み")
  end

  it "does not reapply the same proposal even after a saved plan is edited or deleted" do
    token = propose["proposal_token"]
    save(token)
    expect(response).to have_http_status(:ok)
    existing = user.training_records.find_by!(date: Date.current)
    existing.update!(notes: "保存後の編集")
    user.training_records.find_by!(date: Date.current + 1).destroy!
    save(token)
    expect(response).to have_http_status(:ok)
    expect(existing.reload.notes).to eq("保存後の編集")
    expect(user.training_records.count).to eq(6)
    expect(TrainingPlanCommit.where(user: user).count).to eq(1)
  end

  it "rejects a second, stale proposal after saving another proposal" do
    first, second = propose, propose
    save(first["proposal_token"])
    save(second["proposal_token"])
    expect(response).to have_http_status(:conflict)
    expect(TrainingPlanCommit.where(user: user).count).to eq(1)
  end

  it "rejects token tampering, cross-user access, expiration, and a change in Japan's date" do
    result = propose
    save(result["proposal_token"] + "tamper")
    expect(response).to have_http_status(:unprocessable_entity)
    other = create(:user)
    expect { WeeklyPlanService.new(other).commit(result["proposal_token"]) }.to raise_error(WeeklyPlanService::Error)
    travel 61.minutes do
      get "/csrf"
      @csrf_token = JSON.parse(response.body).fetch("csrf_token")
      save(result["proposal_token"])
      expect(response).to have_http_status(:unprocessable_entity)
    end
    travel_to Time.current.end_of_day - 10.minutes
    get "/csrf"
    @csrf_token = JSON.parse(response.body).fetch("csrf_token")
    token = propose["proposal_token"]
    travel 20.minutes do
      save(token)
      expect(response).to have_http_status(:conflict)
    end
    expect(user.training_records.count).to eq(0)
  end

  it "maintains CSRF rejection and session revocation on both new endpoints" do
    token = propose["proposal_token"]
    [ "/weekly_plans/propose", "/weekly_plans/save" ].each do |path|
      post path, params: { proposal_token: token }, as: :json
      expect(response).to have_http_status(:forbidden)
      post path, params: { proposal_token: token }, headers: { "X-CSRF-Token" => "invalid" }, as: :json
      expect(response).to have_http_status(:forbidden)
      post path, params: { proposal_token: token }, headers: csrf_headers.merge("Origin" => "https://evil.example"), as: :json
      expect(response).to have_http_status(:forbidden)
    end
    delete "/logout", headers: csrf_headers
    post "/weekly_plans/save", params: { proposal_token: token }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:unauthorized)
  end

  it "generates to race day in chunks, applies recurring limits, and saves only a complete proposal" do
    profile.update!(race_date: Date.current + 64)
    calls = []
    allow(ai).to receive(:generate_training_records) do |**args|
      calls << args
      { "training_records" => args.fetch(:available_minutes_by_date).map do |date, limit|
        { "date" => date, "training_type" => limit.zero? ? "rest" : "easy_run", "description" => "無理のない練習",
          "duration_minutes" => limit.zero? ? nil : 20, "distance_km" => nil, "pace" => nil, "notes" => "" }
      end }
    end
    proposal = propose
    expect(proposal["complete"]).to be(false)
    expect(proposal["days"].length).to eq(28)
    expect(proposal["end_date"]).to eq(profile.race_date.to_s)
    save(proposal["proposal_token"])
    expect(response).to have_http_status(:unprocessable_entity)
    expect(user.training_records.count).to eq(0)
    while !proposal["complete"]
      post "/weekly_plans/propose", params: { proposal_token: proposal["proposal_token"] }, headers: csrf_headers, as: :json
      expect(response).to have_http_status(:ok)
      proposal = JSON.parse(response.body)
      expect(user.training_records.count).to eq(0)
    end
    expect(calls.map { |args| args[:days] }).to eq([ 28, 28, 8 ])
    expect(calls.last[:preceding_plans].length).to eq(14)
    expect(proposal["days"].map { |day| day["date"] }).to eq((Date.current..profile.race_date).map(&:to_s))
    proposal["days"][0...-1].each do |day|
      expect(day["available_minutes"]).to eq(profile.available_minutes(Date.iso8601(day["date"])))
    end
    expect(proposal["days"].last).to include("available_minutes" => nil, "record" => hash_including("training_type" => "race"))
    save(proposal["proposal_token"])
    expect(response).to have_http_status(:ok)
    expect(user.training_records.count).to eq(65)
    expect(user.training_records.maximum(:date)).to eq(profile.race_date)
    save(proposal["proposal_token"])
    expect(TrainingPlanCommit.where(user: user).count).to eq(1)
  end

  it "resumes after a failed chunk without changing records or extending the expiration" do
    profile.update!(race_date: Date.current + 40)
    calls = 0
    allow(ai).to receive(:generate_training_records) do |**args|
      calls += 1
      raise ChatgptService::Error, "再試行してください。" if calls == 2
      { "training_records" => args.fetch(:available_minutes_by_date).map do |date, _limit|
        { "date" => date, "training_type" => "rest", "description" => "休養", "duration_minutes" => nil,
          "distance_km" => nil, "pace" => nil, "notes" => "" }
      end }
    end
    first = propose
    token = first["proposal_token"]
    post "/weekly_plans/propose", params: { proposal_token: token }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(user.training_records.count).to eq(0)
    post "/weekly_plans/propose", params: { proposal_token: token }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    result = JSON.parse(response.body)
    expect(result["complete"]).to be(true)
    expect(result["days"].length).to eq(41)
    expect(result["expires_at"]).to eq(first["expires_at"])
    expect(user.training_records.count).to eq(0)
    expect(TrainingPlanCommit.count).to eq(0)
    expect { WeeklyPlanService.new(create(:user)).propose(token) }.to raise_error(WeeklyPlanService::Error)
    profile.update!(weight: 61)
    post "/weekly_plans/propose", params: { proposal_token: token }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "rejects invalid continuation tokens and oversized horizons without calling AI" do
    expect(ai).not_to receive(:generate_training_records)
    [ "invalid", {}, "", "x" * (WeeklyPlanService::MAX_TOKEN_BYTES + 1) ].each do |token|
      post "/weekly_plans/propose", params: { proposal_token: token }, headers: csrf_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
    profile.update!(race_date: Date.current + 366)
    post "/weekly_plans/propose", headers: csrf_headers, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "registers only the race event when the race is today without calling AI" do
    profile.update!(race_date: Date.current)
    expect(ai).not_to receive(:generate_training_records)
    proposal = propose
    expect(proposal["complete"]).to be(true)
    expect(proposal["days"].length).to eq(1)
    save(proposal["proposal_token"])
    expect(response).to have_http_status(:ok)
    expect(user.training_records.sole.training_type).to eq("race")
  end

  it "passes only the runner's recent completed actuals and reflections to the AI" do
    user.training_records.create!(date: Date.current - 1, training_type: "easy_run", distance_km: 10, actual_distance_km: 3,
      duration_minutes: 60, actual_duration_minutes: 20, completed: true, feedback: "疲れた")
    user.training_records.create!(date: Date.current - 28, training_type: "easy_run", completed: true, feedback: "古い")
    user.training_records.create!(date: Date.current, training_type: "easy_run", completed: false)
    create(:user).training_records.create!(date: Date.current, training_type: "easy_run", completed: true)
    expect(ai).to receive(:generate_training_records).with(hash_including(days: 6, recent_activities: [ hash_including(distance_km: 3, duration_minutes: 20, feedback: "疲れた") ]))
    expect(propose["recent_activity_count"]).to eq(1)
  end
end
