require "rails_helper"

RSpec.configure do |config|
  config.openapi_root = Rails.root.join("openapi").to_s
  config.openapi_specs = {
    "v1/swagger.yaml" => {
      openapi: "3.0.1",
      info: {
        title: "API V1",
        version: "v1"
      },
      servers: [
        {
          url: ENV.fetch("OPENAPI_SERVER_URL", "http://localhost:3000"),
          description: "Default server"
        }
      ],
      paths: {},
      components: {
        schemas: {}
      }
    }
  }
  config.openapi_format = :yaml
end
