require "rails_helper"

RSpec.describe ChatgptService do
  include ActiveSupport::Testing::TimeHelpers
  let(:profile) { build(:profile, race_date: Date.current + 120) }
  let(:service) { described_class.new(api_key: "test-only") }
  let(:params) { { profile: profile, days: 2, training_days: [ "monday" ] } }

  it "rejects unbounded/noninteger periods, unknown weekdays, stale goals, and oversized requests before calling OpenAI" do
    expect(service).not_to receive(:post_to_openai)
    [ { days: 0 }, { days: 32 }, { days: 1.5 }, { days: "7" }, { training_days: [] }, { training_days: [ "invalid" ] },
      { request_message: "x" * 2001 }, { profile: build(:profile, race_date: Date.yesterday) } ].each do |invalid|
      expect { service.generate_training_records(**params.merge(invalid)) }.to raise_error(ChatgptService::Error)
    end
  end

  it "rejects incomplete, duplicate, invalid or out of range generated dates" do
    [ [], [ { "date" => Date.current.to_s } ], [ { "date" => Date.current.to_s } ] * 2,
      [ { "date" => nil }, { "date" => Date.tomorrow.to_s } ],
      [ { "date" => Date.yesterday.to_s }, { "date" => Date.current.to_s } ] ].each do |records|
      allow(service).to receive(:post_to_openai).and_return({ "output" => [ { "type" => "message", "content" => [
        { "type" => "output_text", "text" => { training_records: records }.to_json }
      ] } ] })
      expect { service.generate_training_records(**params) }.to raise_error(ChatgptService::Error)
    end
  end

  it "uses Japan's date for early morning plans" do
    travel_to Time.utc(2026, 10, 20, 15, 30) do
      expect(Date.current).to eq(Date.new(2026, 10, 21))
      records = [ { "date" => "2026-10-21", "training_type" => "rest" } ]
      allow(service).to receive(:post_to_openai).and_return({ "output" => [ { "type" => "message", "content" => [
        { "type" => "output_text", "text" => { training_records: records }.to_json }
      ] } ] })
      expect(service.generate_training_records(**params.merge(days: 1))).to eq("training_records" => records)
    end
  end

  it "accepts exactly one plan per requested date" do
    records = [ Date.current, Date.tomorrow ].map { |date| { "date" => date.to_s, "training_type" => "rest" } }
    allow(service).to receive(:post_to_openai).and_return({ "output" => [ { "type" => "message", "content" => [
      { "type" => "output_text", "text" => { training_records: records }.to_json }
    ] } ] })
    expect(service.generate_training_records(**params)).to eq("training_records" => records)
  end
end
