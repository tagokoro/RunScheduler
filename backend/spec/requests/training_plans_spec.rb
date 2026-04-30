require "rails_helper"

RSpec.describe "TrainingPlans API", type: :request do
  let(:service) { instance_double(ChatgptService) }
  let(:user) do
    User.create!(
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/avatar.png"
    )
  end

  before do
    OmniAuth.config.test_mode = true
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: "google_oauth2",
      uid: "12345",
      info: {
        name: user.name,
        email: user.email,
        image: user.image
      }
    )

    get "/auth/google_oauth2/callback"
    allow(ChatgptService).to receive(:new).and_return(service)
  end

  after do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end

  describe "POST /training_plans" do
    let(:params) do
      {
        days: 7,
        training_days: %w[monday wednesday saturday],
        request_message: "無理のない範囲で組んでください"
      }
    end

    context "when profile exists" do
      let!(:profile) { FactoryBot.create(:profile, user: user) }

      it "saves and returns generated training records" do
        allow(service).to receive(:generate_training_plan).and_return(
          {
            "training_records" => [
              {
                "date" => "2026-05-01",
                "training_type" => "easy_run",
                "description" => "30分のイージーラン",
                "distance_km" => 5.0,
                "duration_minutes" => 30,
                "pace" => "6:00/km",
                "completed" => false,
                "feedback" => nil,
                "notes" => "余裕を持って走る"
              }
            ]
          }
        )

        expect do
          post "/training_plans", params: params
        end.to change(TrainingRecord, :count).by(1)

        expect(response).to have_http_status(:ok)
        parsed_body = JSON.parse(response.body)
        expect(parsed_body["training_records"]).to be_an(Array)
        expect(parsed_body.dig("training_records", 0, "training_type")).to eq("easy_run")
        expect(parsed_body.dig("training_records", 0, "id")).to be_present

        saved_record = user.training_records.find_by(date: Date.parse("2026-05-01"))
        expect(saved_record).to be_present
        expect(saved_record.training_type).to eq("easy_run")
        expect(saved_record.description).to eq("30分のイージーラン")
      end
    end

    context "when profile does not exist" do
      it "returns not found" do
        post "/training_plans", params: params

        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)).to eq({ "error" => "profile not found" })
      end
    end
  end
end
