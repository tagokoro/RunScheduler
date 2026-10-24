require "rails_helper"

RSpec.describe "Usual weekly training schedule", type: :request do
  let(:user) { create(:user) }
  let!(:profile) { create(:profile, user: user, race_date: Date.current + 100) }
  before { sign_in_with_google(user) }
  after { reset_google_auth }

  it "keeps old profiles valid, distinguishes unset from rest, and preserves the other goals" do
    expect(profile.weekly_availability).to eq({})
    expect(profile.schedule_configured?).to be(false)
    patch "/me/profile", params: { weekly_availability: { monday: 30, tuesday: 0, wednesday: nil } }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:no_content)
    expect(profile.reload.weekly_availability).to eq("monday" => 30, "tuesday" => 0, "wednesday" => nil)
    expect(profile.target_race_type).to eq("half")
    get "/me/profile"
    expect(JSON.parse(response.body).fetch("weekly_availability")).to eq(profile.weekly_availability)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "rejects invalid shapes, unknown weekdays, fractional, negative, oversized and string times" do
    [ "invalid", [], { monday: -1 }, { monday: 1441 }, { monday: 30.5 }, { monday: "30" }, { holiday: 30 } ].each do |schedule|
      patch "/me/profile", params: { weekly_availability: schedule }, headers: csrf_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(profile.reload.weekly_availability).to eq({})
    end
  end

  it "does not modify any other runner's profile or schedule" do
    other = create(:profile, race_date: Date.current + 100)
    patch "/me/profile", params: { user_id: other.user_id, weekly_availability: { monday: 45 } }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:no_content)
    expect(other.reload.weekly_availability).to eq({})
    expect(profile.reload.weekly_availability).to eq("monday" => 45)
  end
end
