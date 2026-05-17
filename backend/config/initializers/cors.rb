frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3001")
frontend_origin = URI.parse(frontend_url).then do |uri|
  default_port =
    (uri.scheme == "http" && uri.port == 80) ||
    (uri.scheme == "https" && uri.port == 443)
  [uri.scheme, "://", uri.host, default_port ? nil : ":#{uri.port}"].join
end
frontend_host = URI.parse(frontend_origin).host

allowed_origins = [frontend_origin, "http://localhost:3001"]
allowed_origin_patterns = []

if frontend_host&.end_with?(".vercel.app")
  project_slug = frontend_host.delete_suffix(".vercel.app")
  allowed_origin_patterns << %r{\Ahttps://#{Regexp.escape(project_slug)}(?:-[a-z0-9-]+)?\.vercel\.app\z}
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins, *allowed_origin_patterns)

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
