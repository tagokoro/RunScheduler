require "rails_helper"

RSpec.describe "Session security", type: :request do
  let(:user) { create(:user) }
  after { reset_google_auth }

  def auth_cookie
    cookies[LoginSession::COOKIE_NAME]
  end

  def csrf_token
    get "/csrf"
    JSON.parse(response.body).fetch("csrf_token")
  end

  it "stores only a token digest and returns the current user" do
    sign_in_with_google(user)
    expect(LoginSession.last.token_digest).to eq(Digest::SHA256.hexdigest(auth_cookie))
    expect(LoginSession.last.expires_at).to be_within(5.seconds).of(30.days.from_now)
    get "/me"
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig("user", "id")).to eq(user.id)
  end

  it "rejects a saved cookie after logout and deletes the browser cookie" do
    sign_in_with_google(user)
    saved_cookie = auth_cookie
    delete "/logout", headers: csrf_headers
    expect(response).to have_http_status(:no_content)
    expect(auth_cookie).to be_blank
    expect(LoginSession.last.revoked_at).to be_present
    cookies[LoginSession::COOKIE_NAME] = saved_cookie
    get "/me"
    expect(response).to have_http_status(:unauthorized)
  end

  it "revokes only the session on the device that logs out" do
    sign_in_with_google(user)
    first_cookie = auth_cookie
    cookies.delete(LoginSession::COOKIE_NAME)
    cookies.delete("_oauth_session")
    sign_in_with_google(user)
    second_cookie = auth_cookie
    expect(second_cookie).not_to eq(first_cookie)
    delete "/logout", headers: csrf_headers
    cookies[LoginSession::COOKIE_NAME] = first_cookie
    get "/me"
    expect(response).to have_http_status(:ok)
  end

  it "rotates both cookies on login and revokes the previous login session" do
    sign_in_with_google(user)
    old_auth = auth_cookie
    old_oauth = cookies["_oauth_session"]
    sign_in_with_google(user)
    expect(auth_cookie).not_to eq(old_auth)
    expect(cookies["_oauth_session"]).not_to eq(old_oauth)
    expect(LoginSession.authenticate(old_auth)).to be_nil
  end

  [ :expired, :revoked, :tampered, :legacy ].each do |state|
    it "rejects #{state} authentication" do
      sign_in_with_google(user)
      case state
      when :expired then LoginSession.last.update!(expires_at: 1.second.ago)
      when :revoked then LoginSession.last.revoke!
      when :tampered then cookies[LoginSession::COOKIE_NAME] = "x" * 43
      when :legacy
        cookies["_app_session"] = auth_cookie
        cookies.delete(LoginSession::COOKIE_NAME)
      end
      get "/me"
      expect(response).to have_http_status(:unauthorized)
      patch "/me/profile", params: {}, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  it "rejects state changes without a valid CSRF token" do
    sign_in_with_google(user)
    [ nil, "invalid" ].each do |token|
      headers = { "X-CSRF-Token" => token }.compact
      delete "/logout", headers: headers
      expect(response).to have_http_status(:forbidden)
      patch "/me/profile", params: {}, as: :json, headers: headers
      expect(response).to have_http_status(:forbidden)
      post "/training_records", params: {}, as: :json, headers: headers
      expect(response).to have_http_status(:forbidden)
      patch "/training_records/missing", params: {}, as: :json, headers: headers
      expect(response).to have_http_status(:forbidden)
      delete "/training_records/missing", headers: headers
      expect(response).to have_http_status(:forbidden)
    end
    expect(LoginSession.last.revoked_at).to be_nil
  end

  it "rejects foreign and null origins even with a valid token" do
    sign_in_with_google(user)
    [ "https://attacker.example", "null" ].each do |origin|
      delete "/logout", headers: csrf_headers.merge("Origin" => origin)
      expect(response).to have_http_status(:forbidden)
    end
  end

  it "rejects CSRF tokens from another browser session" do
    stranger = ActionDispatch::Integration::Session.new(Rails.application)
    stranger.get "/csrf"
    stranger_token = JSON.parse(stranger.response.body).fetch("csrf_token")
    sign_in_with_google(user)
    delete "/logout", headers: { "X-CSRF-Token" => stranger_token }
    expect(response).to have_http_status(:forbidden)
    expect(LoginSession.last.revoked_at).to be_nil
  end

  it "sets host-only HTTPS cookie attributes in production and preserves them on deletion" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("SESSION_SAME_SITE", "lax").and_return("lax")
    stub_const("LoginSession::COOKIE_NAME", "__Host-run_session")
    https!
    sign_in_with_google(user)
    get "/auth/google_oauth2/callback"
    header = Array(response.headers["Set-Cookie"]).find { |value| value.start_with?("__Host-run_session=") }
    expect(header).to include("path=/", "secure", "httponly", "samesite=lax", "expires=")
    expect(header).not_to include("domain=")
    token = csrf_token
    delete "/logout", headers: { "X-CSRF-Token" => token }
    expect(response).to have_http_status(:no_content)
    header = Array(response.headers["Set-Cookie"]).find { |value| value.start_with?("__Host-run_session=") }
    expect(header).to include("path=/", "secure", "httponly", "samesite=lax", "max-age=0")
  end

  it "allows credentialed requests from the configured frontend" do
    sign_in_with_google(user)
    delete "/logout", headers: csrf_headers.merge("Origin" => "http://localhost:3001")
    expect(response).to have_http_status(:no_content)
    expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:3001")
    expect(response.headers["Access-Control-Allow-Credentials"]).to eq("true")
  end

  it "does not expose CSRF tokens to untrusted origins or caches" do
    get "/csrf", headers: { "Origin" => "https://attacker.example" }
    expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
    expect(response.headers["Cache-Control"]).to eq("no-store")
  end

  it "requires a CSRF-protected POST to start OAuth" do
    OmniAuth.config.test_mode = true
    get "/auth/google_oauth2"
    expect(response).to have_http_status(:not_found)
    post "/auth/google_oauth2"
    expect(response).to have_http_status(:redirect)
    expect(response.location).to include("InvalidAuthenticityToken")
    token = csrf_token
    post "/auth/google_oauth2", params: { authenticity_token: token }, headers: { "Origin" => "https://attacker.example" }
    expect(response.location).to include("InvalidAuthenticityToken")
    post "/auth/google_oauth2", params: { authenticity_token: token }, headers: { "Origin" => "http://localhost:3001" }
    expect(response).to have_http_status(:redirect)
  end

  it "rejects OAuth callbacks without the expected state" do
    OmniAuth.config.test_mode = false
    token = csrf_token
    post "/auth/google_oauth2", params: { authenticity_token: token }
    expect(response.location).to start_with("https://accounts.google.com/")
    get "/auth/google_oauth2/callback", params: { code: "forged-code", state: "forged-state" }
    expect(response).to have_http_status(:redirect)
    expect(response.location).to include("csrf_detected")
    expect(LoginSession.count).to eq(0)
  end

  it "isolates profiles and training records between users" do
    other_user = create(:user, email: "other@example.com")
    other_profile = create(:profile, user: other_user)
    other_record = TrainingRecord.create!(user: other_user, date: Date.current, training_type: "rest")
    sign_in_with_google(user)
    get "/me/profile", params: { user_id: other_user.id }
    expect(response).to have_http_status(:not_found)
    get "/training_records"
    expect(JSON.parse(response.body).fetch("training_records")).to eq([])
    get "/training_records/today"
    expect(JSON.parse(response.body).fetch("training_record")).to be_nil
    patch "/me/profile", params: other_profile.attributes.except("id", "created_at", "updated_at").merge("age" => 45), headers: csrf_headers, as: :json
    expect(response).to have_http_status(:no_content)
    expect(other_profile.reload.age).to eq(30)
    expect(user.reload.profile.age).to eq(45)
    patch "/training_records/#{other_record.id}", params: { completed: true }, headers: csrf_headers, as: :json
    expect(response).to have_http_status(:not_found)
    delete "/training_records/#{other_record.id}", headers: csrf_headers
    expect(response).to have_http_status(:not_found)
    expect(other_record.reload.completed).to be(false)
  end
end
