require "swagger_helper"

RSpec.describe "Profile API", type: :request do
  let(:profile_params) do
    {
      age: 30,
      weight: 60.0,
      best_5k_seconds: 1200,
      best_half_seconds: 7200,
      best_full_seconds: 15120,
      target_race_type: "half",
      target_time_seconds: 7200,
      race_date: "2026-12-01"
    }
  end
  let(:user) { create(:user) }
  before do
    sign_in_with_google(user)
  end
  after do
    reset_google_auth
  end
  path "/me/profile" do
    patch("update user profile") do
      parameter name: "X-CSRF-Token", in: :header, required: true, schema: { type: :string }
      let(:"X-CSRF-Token") { @csrf_token }
      tags "Profile"
      consumes "application/json"

      parameter name: :profile_params,
                in: :body,
                schema: {
                  type: :object,
                  properties: {
                    age: { type: :integer, minimum: 0, maximum: 120 },
                    weight: { type: :number, format: :float, minimum: 0.1, maximum: 999.9 },
                    best_5k_seconds: { type: :integer, nullable: true, minimum: 1 },
                    best_half_seconds: { type: :integer, nullable: true, minimum: 1 },
                    best_full_seconds: { type: :integer, nullable: true, minimum: 1 },
                    target_race_type: { type: :string },
                    target_time_seconds: { type: :integer, minimum: 1 },
                    race_date: { type: :string, format: :date }
                  },
                  required: [ "age", "weight", "target_race_type", "target_time_seconds", "race_date" ]
                }
      response "204", "user profile is updated" do
        run_test!
      end

      response "422", "profile is invalid" do
        let(:profile_params) do
          {
            age: -1,
            weight: 60.0,
            best_5k_seconds: 1200,
            best_half_seconds: 7200,
            best_full_seconds: 15120,
            target_race_type: "half",
            target_time_seconds: 7200,
            race_date: "2026-12-01"
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
                 age: { type: :integer, minimum: 0, maximum: 120 },
                 weight: { type: :number, format: :float, minimum: 0.1, maximum: 999.9 },
                 best_5k_seconds: { type: :integer, nullable: true, minimum: 1 },
                 best_half_seconds: { type: :integer, nullable: true, minimum: 1 },
                 best_full_seconds: { type: :integer, nullable: true, minimum: 1 },
                 target_race_type: { type: :string },
                 target_time_seconds: { type: :integer, minimum: 1 },
                 race_date: { type: :string, format: :date }
               },
               required: [ "age", "weight", "target_race_type", "target_time_seconds", "race_date" ]
        run_test!
      end
    end
  end
end
