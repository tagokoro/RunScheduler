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

    get "/auth/google_oauth2/callback"
  end

  def reset_google_auth
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end
end
