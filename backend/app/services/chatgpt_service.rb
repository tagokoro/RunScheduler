require "json"
require "net/http"
require "uri"

class ChatgptService
  class Error < StandardError
    attr_reader :status

    def initialize(message, status: nil)
      super(message)
      @status = status
    end
  end

  OPENAI_API_URL = "https://api.openai.com/v1/responses".freeze
  DEFAULT_MODEL = "gpt-4.1".freeze

  def initialize(model: DEFAULT_MODEL, api_key: nil)
    @model = model
    @api_key = api_key || Rails.application.credentials.dig(:openai, :api_key)

    raise Error, "openai api key is not configured" if @api_key.blank?
  end

  def generate_training_plan(profile:, days:, training_days:, request_message: nil)
    raise Error, "profile is required" if profile.blank?
    raise Error, "days must be greater than 0" if days.to_i <= 0
    raise Error, "training_days is required" if training_days.blank?

    response = post_to_openai(
      input: build_input(
        profile:,
        days:,
        training_days:,
        request_message:
      ),
      text_format: training_plan_schema
    )

    parse_training_plan_response(response)
  end

  private

  attr_reader :api_key, :model

  def post_to_openai(input:, text_format:)
    uri = URI.parse(OPENAI_API_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.request_uri)
    request["Content-Type"] = "application/json"
    request["Authorization"] = "Bearer #{api_key}"
    request.body = {
      model:,
      input:,
      text: {
        format: text_format
      }
    }.to_json

    response = http.request(request)
    body = JSON.parse(response.body)

    return body if response.is_a?(Net::HTTPSuccess)

    message = body.dig("error", "message") || "OpenAI API request failed"
    raise Error.new(message, status: response.code.to_i)
  rescue JSON::ParserError
    raise Error, "OpenAI API returned invalid JSON"
  end

  def build_input(profile:, days:, training_days:, request_message:)
    [
      {
        role: "system",
        content: build_system_prompt
      },
      {
        role: "user",
        content: build_user_prompt(
          profile:,
          days:,
          training_days:,
          request_message:
        )
      }
    ]
  end

  def build_system_prompt
    <<~PROMPT
      あなたはランニングコーチです。
      入力されるプロフィール情報をもとに、現実的で安全寄りのランニング計画を作成してください。

      出力は必ずJSONにしてください。
      training_records テーブルの形式に合わせて、各日のメニューを training_records 配列として返してください。

      制約:
      - date は YYYY-MM-DD
      - training_type は短い識別子にする。例: easy_run, interval, tempo, long_run, recovery_run, rest, cross_training, race_pace
      - description はその日のメニュー内容を日本語で簡潔に書く
      - distance_km は不要なら null
      - duration_minutes は不要なら null
      - pace は不要なら null
      - completed は必ず false
      - feedback は必ず null
      - notes には補足や注意点を日本語で入れる。不要なら空文字
      - 入力された日数分ちょうど返す
      - 休養日も必要に応じて含める
      - ケガ予防を優先し、急激に負荷を上げない
    PROMPT
  end

  def build_user_prompt(profile:, days:, training_days:, request_message:)
    start_date = Date.current
    <<~PROMPT
      次のプロフィールをもとに、#{start_date} から #{days} 日分のランニング計画を作成してください。

      プロフィール:
      - 年齢: #{profile.age}
      - 体重: #{profile.weight}
      - 5kmベスト(秒): #{profile.best_5k_seconds || "不明"}
      - ハーフベスト(秒): #{profile.best_half_seconds || "不明"}
      - フルベスト(秒): #{profile.best_full_seconds || "不明"}
      - 目標レース種別: #{profile.target_race_type}
      - 目標タイム(秒): #{profile.target_time_seconds}
      - レース日: #{profile.race_date}

      トレーニング実施曜日:
      - #{Array(training_days).join(", ")}

      ユーザー要望:
      #{request_message.presence || "特になし"}

      補足:
      - トレーニングを入れるのは指定された曜日を優先してください
      - それ以外の曜日は rest を基本にしてください
    PROMPT
  end

  def training_plan_schema
    {
      type: "json_schema",
      name: "training_plan",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          training_records: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                date: { type: "string", format: "date" },
                training_type: { type: "string" },
                description: { type: "string" },
                distance_km: { anyOf: [ { type: "number" }, { type: "null" } ] },
                duration_minutes: { anyOf: [ { type: "integer" }, { type: "null" } ] },
                pace: { anyOf: [ { type: "string" }, { type: "null" } ] },
                completed: { type: "boolean" },
                feedback: { anyOf: [ { type: "string" }, { type: "null" } ] },
                notes: { type: "string" }
              },
              required: [
                "date",
                "training_type",
                "description",
                "distance_km",
                "duration_minutes",
                "pace",
                "completed",
                "feedback",
                "notes"
              ]
            }
          }
        },
        required: [ "training_records" ]
      }
    }
  end

  def parse_training_plan_response(response_body)
    output_text = extract_output_text(response_body["output"])
    raise Error, "OpenAI response text is empty" if output_text.blank?

    JSON.parse(output_text)
  rescue JSON::ParserError
    raise Error, "OpenAI response is not valid JSON"
  end

  def extract_output_text(output)
    return nil unless output.is_a?(Array)

    output.each do |item|
      next unless item["type"] == "message"

      content = item["content"]
      next unless content.is_a?(Array)

      text = content.filter_map do |part|
        part["text"] if part["type"] == "output_text"
      end.join

      return text if text.present?
    end

    nil
  end
end
