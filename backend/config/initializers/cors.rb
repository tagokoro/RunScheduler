frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3001")
frontend_origin = URI.parse(frontend_url).then do |uri|
  default_port =
    (uri.scheme == "http" && uri.port == 80) ||
    (uri.scheme == "https" && uri.port == 443)
  [uri.scheme, "://", uri.host, default_port ? nil : ":#{uri.port}"].join
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins frontend_origin

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
