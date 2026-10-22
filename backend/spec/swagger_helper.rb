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
        schemas: {
          ProposedTrainingRecord: {
            type: :object, required: %w[date training_type description duration_minutes distance_km pace notes],
            properties: {
              date: { type: :string, format: :date }, training_type: { type: :string }, description: { type: :string, nullable: true },
              duration_minutes: { type: :integer, nullable: true }, distance_km: { type: :number, nullable: true },
              pace: { type: :string, nullable: true }, notes: { type: :string, nullable: true }
            }
          },
          SavedTrainingRecord: {
            allOf: [ { "$ref" => "#/components/schemas/ProposedTrainingRecord" }, {
              type: :object, required: %w[id completed actual_distance_km actual_duration_minutes feedback],
              properties: {
                id: { type: :string, format: :uuid }, completed: { type: :boolean },
                actual_distance_km: { type: :number, nullable: true }, actual_duration_minutes: { type: :integer, nullable: true },
                feedback: { type: :string, nullable: true }
              }
            } ]
          }
        }
      }
    }
  }
  config.openapi_format = :yaml
end
