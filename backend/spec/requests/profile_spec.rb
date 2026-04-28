require "swagger_helper"

RSpec.describe "Profile API", type: :request do
  let(:profile_params) do
    {
      profile: {
        age: 30,
        weight: 60.0,
        best_5k_seconds: 1200,
        best_half_seconds: 7200,
        best_full_seconds: 15120,
        target_race_type: "half",
        target_time_seconds: 7200,
        race_date: "2026-12-01"
      }
    }
  end
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
  end
  after do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end
  path "/me/profile" do
    patch("update user profile") do
      tags "Profile"
      consumes "application/json"

      parameter name: :profile_params,
                in: :body,
                schema: {
                  type: :object,
                  properties: {
                    profile: {
                      type: :object,
                      properties: {
                        age: { type: :integer },
                        weight: { type: :number, format: :float },
                        best_5k_seconds: { type: :integer },
                        best_half_seconds: { type: :integer },
                        best_full_seconds: { type: :integer },
                        target_race_type: { type: :string },
                        target_time_seconds: { type: :integer },
                        race_date: { type: :string, format: :date }
                      },
                      required: [ "age", "weight", "target_race_type", "target_time_seconds", "race_date" ]
                    }
                  },
                  required: [ "profile" ]
                }
      response "204", "user profile is updated" do
        run_test!
      end

      response "422", "profile is invalid" do
        let(:profile_params) do
          {
            profile: {
              age: -1,
              weight: 60.0,
              best_5k_seconds: 1200,
              best_half_seconds: 7200,
              best_full_seconds: 15120,
              target_race_type: "half",
              target_time_seconds: 7200,
              race_date: "2026-12-01"
            }
          }
        end

        schema type: :object,
               properties: {
                 errors: {
                   type: :array,
                   items: { type: :string }
                 }
               },
               required: [ "errors" ]

        run_test!
      end
    end
    get("get user profile") do
      tags "Profile"
      produces "application/json"

      response "404", "user profile is not exist" do
        schema type: :object,
              properties: {
                error: { type: :string, example: "profile not found" }
              },
              required: [ "error" ]
        run_test!
      end

      response "200", "user profile is returned" do
        let!(:profile) { FactoryBot.create(:profile, user: user) }
        schema type: :object,
               properties: {
                 profile: {
                   type: :object,
                   properties: {
                     age: { type: :integer },
                     weight: { type: :number, format: :float },
                     best_5k_seconds: { type: :integer },
                     best_half_seconds: { type: :integer },
                     best_full_seconds: { type: :integer },
                     target_race_type: { type: :string },
                     target_time_seconds: { type: :integer },
                     race_date: { type: :string, format: :date }
                   },
                   required: [ "age", "weight", "target_race_type", "target_time_seconds", "race_date" ]
                 }
               },
               required: [ "profile" ]
        run_test!
      end
    end
  end
end
