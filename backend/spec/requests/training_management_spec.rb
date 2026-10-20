require "rails_helper"

RSpec.describe "Training management", type: :request do
  let(:user) { create(:user) }
  let!(:record) do
    user.training_records.create!(date: Date.current - 1, training_type: "easy_run", distance_km: 5, duration_minutes: 30)
  end

  before { sign_in_with_google(user) }
  after { reset_google_auth }

  it "records actuals and reflection without changing the plan, and aggregates actuals" do
    patch "/training_records/#{record.id}", params: {
      completed: true, actual_distance_km: 4.25, actual_duration_minutes: 28, feedback: "少し疲れたので短縮"
    }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload).to have_attributes(distance_km: 5, duration_minutes: 30, actual_distance_km: 4.25,
      actual_duration_minutes: 28, feedback: "少し疲れたので短縮", completed: true)
    expect(JSON.parse(response.body).fetch("training_record")).to include("actual_distance_km" => 4.25, "actual_duration_minutes" => 28)

    get "/training_records/stats", params: { group_by: "day" }
    expect(JSON.parse(response.body).fetch("stats")).to eq([
      { "period" => record.date.to_s, "total_distance_km" => 4.25, "total_duration_minutes" => 28, "training_count" => 1 }
    ])

    patch "/training_records/#{record.id}", params: { completed: false }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    get "/training_records/stats"
    expect(JSON.parse(response.body).fetch("stats")).to eq([])
    expect(record.reload.feedback).to eq("少し疲れたので短縮")
  end

  it "rejects invalid actuals atomically" do
    [ { actual_distance_km: -1 }, { actual_duration_minutes: 0 }, { actual_duration_minutes: 1.5 }, { feedback: "x" * 2001 } ].each do |invalid|
      patch "/training_records/#{record.id}", params: invalid.merge(completed: true), headers: csrf_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(record.reload.completed).to be(false)
    end
  end

  it "rejects completion of future plans" do
    record.update!(date: Date.tomorrow)
    patch "/training_records/#{record.id}", params: { completed: true }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(record.reload.completed).to be(false)
  end

  it "does not allow editing another runner's actuals" do
    other = create(:user).training_records.create!(date: Date.current, training_type: "easy_run")
    patch "/training_records/#{other.id}", params: { actual_distance_km: 99, feedback: "changed" }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:not_found)
    expect(other.reload.actual_distance_km).to be_nil
  end

  it "preserves completed records, actuals and feedback during regeneration" do
    create(:profile, user: user)
    record.update!(date: Date.current, completed: true, actual_distance_km: 4, actual_duration_minutes: 27, feedback: "記録を保持")
    service = instance_double(ChatgptService)
    allow(ChatgptService).to receive(:new).and_return(service)
    allow(service).to receive(:generate_training_records).and_return(
      { "training_records" => [ { "date" => Date.current.to_s, "training_type" => "long_run", "distance_km" => 20, "completed" => false } ] }
    )
    post "/training_records", params: { days: 1, training_days: [ "monday" ] }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload).to have_attributes(training_type: "easy_run", completed: true, distance_km: 5, actual_distance_km: 4, feedback: "記録を保持")
  end

  it "also preserves activity after its completion was cancelled" do
    create(:profile, user: user)
    record.update!(date: Date.current, actual_distance_km: 4, actual_duration_minutes: 27, feedback: "保存した感想")
    service = instance_double(ChatgptService)
    allow(ChatgptService).to receive(:new).and_return(service)
    allow(service).to receive(:generate_training_records).and_return(
      { "training_records" => [ { "date" => Date.current.to_s, "training_type" => "rest" } ] }
    )
    post "/training_records", params: { days: 1, training_days: [ "monday" ] }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload).to have_attributes(training_type: "easy_run", completed: false, actual_distance_km: 4, feedback: "保存した感想")
  end

  it "replaces only the generated dates and never accepts generated completion" do
    create(:profile, user: user)
    service = instance_double(ChatgptService)
    allow(ChatgptService).to receive(:new).and_return(service)
    allow(service).to receive(:generate_training_records).and_return(
      { "training_records" => [ { "date" => Date.current.to_s, "training_type" => "easy_run", "completed" => true, "feedback" => "invented" } ] }
    )
    post "/training_records", params: { days: 1, training_days: [ "monday" ] }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:ok)
    generated = user.training_records.find_by!(date: Date.current)
    expect(generated.completed).to be(false)
    expect(generated.feedback).to be_nil
    expect(record.reload).to be_present
  end
end
