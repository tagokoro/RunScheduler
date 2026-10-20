module AuthHelper
  def sign_in_with_google(user)
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

    get "/csrf"
    post "/auth/google_oauth2", params: { authenticity_token: JSON.parse(response.body).fetch("csrf_token") }
    get "/auth/google_oauth2/callback"
    get "/csrf"
    @csrf_token = JSON.parse(response.body).fetch("csrf_token")
  end

  def csrf_headers
    { "X-CSRF-Token" => @csrf_token }
  end

  def reset_google_auth
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end
end
