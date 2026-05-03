require 'swagger_helper'

RSpec.describe "Sessions API", type: :request do
  path "/me" do
    get("Returns current user") do
      tags "Sessions"
      produces "application/json"

      response "200", "current user returned" do
        let(:user) { create(:user) }

        before do
          sign_in_with_google(user)
        end
        after do
          reset_google_auth
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
        let(:user) { create(:user) }

        before do
          sign_in_with_google(user)
        end

        after do
          reset_google_auth
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
      let(:user) { create(:user) }

      before do
        sign_in_with_google(user)
      end

      after do
        reset_google_auth
      end
      it "returns user" do
        get "/me"

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
