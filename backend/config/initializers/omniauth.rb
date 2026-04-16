OmniAuth.config.allowed_request_methods = %i[get post]
OmniAuth.config.silence_get_warning = true

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer if Rails.env.development?

  provider :google_oauth2,
            Rails.application.credentials.dig(:google, :client_id),
            Rails.application.credentials.dig(:google, :client_secret),
            {
              scope: 'email, profile',
              prompt: 'select_account',
              image_aspect_ratio: 'square',
              image_size: 50
            }
end