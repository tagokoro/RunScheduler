# Pin both authorization and code exchange to configuration, never proxy headers.
class PublicGoogleOauth2 < OmniAuth::Strategies::GoogleOauth2
  option :name, "google_oauth2"
  option :overridable_authorize_options, OmniAuth::Strategies::GoogleOauth2::AUTHORIZE_OPTIONS - [ :redirect_uri ]

  def callback_url
    WebSecurity.oauth_callback_url
  end

  def redirect(uri)
    status, headers, body = super
    headers["cache-control"] = "private, no-store"
    headers["cdn-cache-control"] = "no-store"
    headers["vercel-cdn-cache-control"] = "no-store"
    [ status, headers, body ]
  end

  def get_access_token(request)
    client_get_token(request.params.fetch("code"), callback_url)
  end
end

OmniAuth.config.full_host = WebSecurity.oauth_callback_url.delete_suffix("/auth/google_oauth2/callback")

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

  provider PublicGoogleOauth2,
            Rails.application.credentials.dig(:google, :client_id),
            Rails.application.credentials.dig(:google, :client_secret),
            {
              scope: "email, profile",
              prompt: "select_account",
              image_aspect_ratio: "square",
              image_size: 50
            }
end
