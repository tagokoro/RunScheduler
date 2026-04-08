  require "swagger_helper"

  RSpec.describe "Health API", type: :request do
    path "/health" do
      get("Returns API health status") do
        tags "Health"
        produces "application/json"

        response "200", "health status returned" do
          schema type: :object,
                 properties: {
                   status: { type: :string, example: "ok" }
                 },
                 required: [ "status" ]

          run_test!
        end
      end
    end
  end
