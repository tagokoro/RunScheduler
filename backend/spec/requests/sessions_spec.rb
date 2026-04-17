require 'swagger_helper'

RSpec.describe "Sessions API", type: :request do
  path "/me" do
    get("Returns current user") do
      tags "Sessions"
      produces "application/json"

      response "200", "current user returned" do
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
        schema type: :object,
              properties: {
                user: {
                  type: :object,
                  properties: {
                    id: { type: :integer, example: 1 },
                    name: { type: :string, nullable: true, example: "Test User" },
                    email: { type: :string, nullable: true, example: "test@example.com" },
                    image: { type: :string, nullable: true, example: "https://example.com/avatar.png" }
                  },
                  required: [ "id", "name", "email", "image" ]
                }
              },
              required: [ "user" ]
        run_test!
      end

      response "401", "unauthorized" do
        schema type: :object,
              properties: {
                error: { type: :string, example: "unauthorized" }
              },
              required: [ "error" ]
        run_test!
      end
    end
  end

  path "/logout" do
    delete("Log out current user") do
      tags "Sessions"
      produces "application/json"

      response "204", "logged out" do
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
        run_test!
      end
    end
  end

  describe "GET /me" do
    context "when not logged in" do
      it "returns unauthorized error" do
        get "/me"

        expect(response).to have_http_status(:unauthorized)
        parsed_body = JSON.parse(response.body)
        expect(parsed_body).to eq({ "error" => "unauthorized" })
      end
    end

    context "when logged in" do
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
      it "returns user" do
        get "/me"

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
