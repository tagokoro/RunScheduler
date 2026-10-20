require "rails_helper"

RSpec.describe "Public OAuth proxy", type: :request do
  let(:callback) { "https://runplan.tagokoro.dev/api/auth/google_oauth2/callback" }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("GOOGLE_OAUTH_CALLBACK_URL").and_return(callback)
    allow(ENV).to receive(:fetch).with("FRONTEND_URL", "http://localhost:3001").and_return("https://runplan.tagokoro.dev")
    OmniAuth.config.test_mode = false
  end

  after { reset_google_auth }

  it "uses the public callback for authorization and code exchange despite spoofed headers and parameters" do
    get "/csrf"
    token = JSON.parse(response.body).fetch("csrf_token")
    post "/auth/google_oauth2", params: { authenticity_token: token, redirect_uri: "https://attacker.example/callback" }, headers: {
      "Origin" => "https://runplan.tagokoro.dev", "X-Forwarded-Host" => "attacker.example", "X-Forwarded-Proto" => "https"
    }
    expect(response.headers["Cache-Control"]).to include("no-store")
    query = Rack::Utils.parse_query(URI(response.location).query)
    expect(query.fetch("redirect_uri")).to eq(callback)
    state = query.fetch("state")
    # Stop at the real token exchange boundary; no Google network request.
    expect_any_instance_of(PublicGoogleOauth2).to receive(:client_get_token).with("test-code", callback).and_raise(OAuth2::Error.new(OAuth2::Response.new(Faraday::Response.new(status: 400, body: "{}"))))
    get "/auth/google_oauth2/callback", params: { state: state, code: "test-code", redirect_uri: "https://attacker.example/callback" }
    expect(response).to have_http_status(:redirect)
    expect(response.location).to include("invalid_credentials")
  end

  it "does not trust a forwarded host to authorize an Origin" do
    get "/csrf"
    token = JSON.parse(response.body).fetch("csrf_token")
    post "/auth/google_oauth2", params: { authenticity_token: token }, headers: {
      "Origin" => "https://attacker.example", "X-Forwarded-Host" => "attacker.example", "X-Forwarded-Proto" => "https"
    }
    expect(response.location).to include("InvalidAuthenticityToken")
  end

  it "returns OAuth failures to the configured frontend" do
    get "/auth/failure", params: { message: "invalid_credentials" }
    expect(response.location).to eq("http://localhost:3001/?auth_error=google")
  end

  it "marks authenticated and unauthorized API responses as uncacheable" do
    get "/me"
    expect(response).to have_http_status(:unauthorized)
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(response.headers["Vercel-CDN-Cache-Control"]).to eq("no-store")
    sign_in_with_google(create(:user))
    get "/me"
    expect(response).to have_http_status(:ok)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end
end
