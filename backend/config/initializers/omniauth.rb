OmniAuth.config.allowed_request_methods = %i[post]

# Use the same exact-origin policy for the OAuth form and authenticated APIs.
class OAuthCsrfVerifier < OmniAuth::RailsCsrfProtection::TokenVerifier
  private

  def valid_request_origin?
    WebSecurity.valid_origin?(request)
  end
end

OmniAuth.config.request_validation_phase = OAuthCsrfVerifier.new

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer if Rails.env.development?

  provider :google_oauth2,
            Rails.application.credentials.dig(:google, :client_id),
            Rails.application.credentials.dig(:google, :client_secret),
            {
              scope: "email, profile",
              prompt: "select_account",
              image_aspect_ratio: "square",
              image_size: 50
            }
end
