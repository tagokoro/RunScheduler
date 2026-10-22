require "rails_helper"

RSpec.describe "Weekly plan AI input" do
  it "sends date-specific caps, available-as-maximum semantics and recent actuals through the real prompt builder" do
    profile = build(:profile, race_date: Date.current + 100)
    limits = (Date.current..Date.current + 6).to_h { |date| [ date.to_s, date.sunday? ? 0 : 30 ] }
    recent = [ { date: Date.yesterday.to_s, distance_km: 4, duration_minutes: 28, feedback: "疲れが残った" } ]
    plans = limits.keys.map { |date| { "date" => date, "training_type" => "rest" } }
    service = ChatgptService.new(api_key: "local-test-only")
    expect(service).to receive(:post_to_openai) do |input:, text_format:|
      message = input.last.fetch(:content)
      expect(message).to include(limits.to_json, recent.to_json, "時間を使う必要はありません", "ウォームアップ", "全メニューを上限内")
      expect(text_format[:type]).to eq("json_schema")
      { "output" => [ { "type" => "message", "content" => [ { "type" => "output_text", "text" => { training_records: plans }.to_json } ] } ] }
    end
    expect(service.generate_training_records(profile: profile, days: 7, training_days: [ "monday" ], available_minutes_by_date: limits,
      recent_activities: recent).fetch("training_records")).to eq(plans)
  end
end
