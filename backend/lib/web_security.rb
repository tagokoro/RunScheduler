require "uri"

module WebSecurity
  def self.allowed_origins
    urls = [ ENV.fetch("FRONTEND_URL", "http://localhost:3001"), *ENV.fetch("ADDITIONAL_FRONTEND_ORIGINS", "").split(",") ]
    urls.map do |url|
      uri = URI.parse(url.strip)
      raise ArgumentError, "Frontend URL must be an HTTP(S) URL" unless %w[http https].include?(uri.scheme) && uri.host && !uri.userinfo
      raise ArgumentError, "Production frontend must use HTTPS" if Rails.env.production? && uri.scheme != "https"

      default_port = uri.port == (uri.scheme == "https" ? 443 : 80)
      "#{uri.scheme}://#{uri.host}#{default_port ? '' : ":#{uri.port}"}"
    end.uniq
  end

  def self.valid_origin?(request)
    request.origin.nil? || allowed_origins.include?(request.origin)
  end

  def self.oauth_callback_url
    value = ENV.fetch("GOOGLE_OAUTH_CALLBACK_URL") do
      Rails.env.production? ? "https://runplan.tagokoro.dev/api/auth/google_oauth2/callback" : "http://localhost:3001/api/auth/google_oauth2/callback"
    end
    uri = URI.parse(value)
    valid = %w[http https].include?(uri.scheme) && uri.host && !uri.userinfo && !uri.query && !uri.fragment
    valid &&= uri.path.end_with?("/auth/google_oauth2/callback")
    valid &&= uri.scheme == "https" if Rails.env.production?
    raise ArgumentError, "Invalid GOOGLE_OAUTH_CALLBACK_URL" unless valid

    value
  end

  def self.cookie_options
    same_site = ENV.fetch("SESSION_SAME_SITE", "lax")
    raise ArgumentError, "SESSION_SAME_SITE must be lax or none" unless %w[lax none].include?(same_site)
    raise ArgumentError, "SameSite=None requires production HTTPS" if same_site == "none" && !Rails.env.production?

    { httponly: true, secure: Rails.env.production?, same_site: same_site.to_sym, path: "/" }
  end
end
