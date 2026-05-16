frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3001")

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins frontend_url

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
