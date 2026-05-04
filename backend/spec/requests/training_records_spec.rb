require "swagger_helper"

RSpec.describe "TrainingRecords API", type: :request do
  let(:user) { create(:user) }

  let(:service) { instance_double(ChatgptService) }

  before do
    sign_in_with_google(user)
    allow(ChatgptService).to receive(:new).and_return(service)
  end

  after do
    reset_google_auth
  end

  path "/training_records" do
    get("list training records") do
      tags "TrainingRecords"
      produces "application/json"

      response "200", "training records returned" do
        let!(:older_record) do
          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 1),
            training_type: "easy_run",
            description: "30分のイージーラン",
            distance_km: 5.0,
            duration_minutes: 30,
            pace: "6:00/km",
            completed: false,
            feedback: nil,
            notes: "余裕を持って走る"
          )
        end

        let!(:newer_record) do
          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 3),
            training_type: "rest",
            description: "休養日",
            distance_km: nil,
            duration_minutes: nil,
            pace: nil,
            completed: false,
            feedback: nil,
            notes: ""
          )
        end

        schema type: :object,
               properties: {
                 training_records: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       id: { type: :string, format: :uuid },
                       date: { type: :string, format: :date },
                       training_type: { type: :string },
                       description: { type: :string, nullable: true },
                       distance_km: { type: :number, format: :float, nullable: true },
                       duration_minutes: { type: :integer, nullable: true },
                       pace: { type: :string, nullable: true },
                       completed: { type: :boolean },
                       feedback: { type: :string, nullable: true },
                       notes: { type: :string, nullable: true }
                     },
                     required: %w[
                       id
                       date
                       training_type
                       description
                       distance_km
                       duration_minutes
                       pace
                       completed
                       feedback
                       notes
                     ]
                   }
                 }
               },
               required: [ "training_records" ]

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["training_records"].size).to eq(2)
          expect(body.dig("training_records", 0, "date")).to eq("2026-05-01")
          expect(body.dig("training_records", 1, "date")).to eq("2026-05-03")
        end
      end
    end

    post("create training records") do
      tags "TrainingRecords"
      consumes "application/json"
      produces "application/json"

      parameter name: :training_record_params,
                in: :body,
                schema: {
                  type: :object,
                  properties: {
                    days: { type: :integer, minimum: 1, example: 7 },
                    training_days: {
                      type: :array,
                      items: {
                        type: :string,
                        enum: %w[monday tuesday wednesday thursday friday saturday sunday]
                      },
                      example: %w[monday wednesday saturday]
                    },
                    request_message: {
                      type: :string,
                      nullable: true,
                      example: "無理のない範囲で組んでください"
                    }
                  },
                  required: %w[days training_days]
                }

      let(:training_record_params) do
        {
          days: 7,
          training_days: %w[monday wednesday saturday],
          request_message: "無理のない範囲で組んでください"
        }
      end

      response "200", "training records created" do
        let!(:profile) { FactoryBot.create(:profile, user: user) }

        before do
          allow(service).to receive(:generate_training_records).and_return(
            {
              "training_records" => [
                {
                  "date" => "2026-05-01",
                  "training_type" => "easy_run",
                  "description" => "30分のイージーラン",
                  "distance_km" => 5.0,
                  "duration_minutes" => 30,
                  "pace" => "6:00/km",
                  "completed" => false,
                  "feedback" => nil,
                  "notes" => "余裕を持って走る"
                }
              ]
            }
          )
        end

        schema type: :object,
               properties: {
                 training_records: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       id: { type: :string, format: :uuid },
                       date: { type: :string, format: :date },
                       training_type: { type: :string },
                       description: { type: :string, nullable: true },
                       distance_km: { type: :number, format: :float, nullable: true },
                       duration_minutes: { type: :integer, nullable: true },
                       pace: { type: :string, nullable: true },
                       completed: { type: :boolean },
                       feedback: { type: :string, nullable: true },
                       notes: { type: :string, nullable: true }
                     },
                     required: %w[
                       id
                       date
                       training_type
                       description
                       distance_km
                       duration_minutes
                       pace
                       completed
                       feedback
                       notes
                     ]
                   }
                 }
               },
               required: [ "training_records" ]

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["training_records"]).to be_an(Array)
          expect(body.dig("training_records", 0, "training_type")).to eq("easy_run")
          expect(body.dig("training_records", 0, "id")).to be_present
        end
      end

      response "404", "profile not found" do
        schema type: :object,
               properties: {
                 error: { type: :string, example: "profile not found" }
               },
               required: [ "error" ]

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq({ "error" => "profile not found" })
        end
      end

      response "422", "openai service error" do
        let!(:profile) { FactoryBot.create(:profile, user: user) }

        before do
          allow(service).to receive(:generate_training_records)
            .and_raise(ChatgptService::Error.new("invalid request", status: 422))
        end

        schema type: :object,
               properties: {
                 error: { type: :string, example: "invalid request" }
               },
               required: [ "error" ]

        run_test!
      end
    end
  end
  path "/training_records/{id}" do
    parameter name: :id, in: :path, type: :string
    delete("delete a training record") do
      tags "TrainingRecords"
      let!(:training_record) do
        TrainingRecord.create!(
          user: user,
          date: Date.new(2026, 5, 1),
          training_type: "easy_run",
          description: "30分のイージーラン",
          distance_km: 5.0,
          duration_minutes: 30,
          pace: "6:00/km",
          completed: false,
          feedback: nil,
          notes: "余裕を持って走る"
        )
      end
      let(:id) { training_record.id }
      response "204", "training record deleted" do
        run_test! do
          expect(response).to have_http_status(:no_content)
          expect(TrainingRecord.find_by(id: training_record.id)).to be_nil
        end
      end
    end
  end
  path "/training_records/today" do
     get("get today's training record") do
      tags "TrainingRecords"
      produces "application/json"

      response "200", "today's training record returned" do
        let!(:today_record) do
          TrainingRecord.create!(
            user: user,
            date: Date.current,
            training_type: "easy_run",
            description: "30分のイージーラン",
            distance_km: 5.0,
            duration_minutes: 30,
            pace: "6:00/km",
            completed: false,
            feedback: nil,
            notes: "余裕を持って走る"
          )
        end
        let!(:other_record) do
          TrainingRecord.create!(
            user: user,
            date: Date.current + 1.day,
            training_type: "rest",
            description: "休養日",
            distance_km: nil,
            duration_minutes: nil,
            pace: nil,
            completed: false,
            feedback: nil,
            notes: ""
          )
        end

        schema type: :object,
                properties: {
                  training_record: {
                    type: :object,
                    nullable: true,
                    properties: {
                      id: { type: :string, format: :uuid },
                      date: { type: :string, format: :date },
                      training_type: { type: :string },
                      description: { type: :string, nullable: true },
                      distance_km: { type: :number, format: :float, nullable: true
                      },
                      duration_minutes: { type: :integer, nullable: true },
                      pace: { type: :string, nullable: true },
                      completed: { type: :boolean },
                      feedback: { type: :string, nullable: true },
                      notes: { type: :string, nullable: true }
                    },
                    required: %w[
                      id
                      date
                      training_type
                      description
                      distance_km
                      duration_minutes
                      pace
                      completed
                      feedback
                      notes
                    ]
                  }
                },
                required: [ "training_record" ]
          run_test! do |response|
            body = JSON.parse(response.body)
            expect(body["training_record"]["date"]).to eq(Date.current.to_s)
            expect(body["training_record"]["training_type"]).to eq("easy_run")
          end
      end
    end
  end
  describe "DELETE /training_records/{id}" do
    let!(:training_record) do
      TrainingRecord.create!(
        user: user,
        date: Date.new(2026, 5, 1),
        training_type: "easy_run",
        description: "30分のイージーラン",
        distance_km: 5.0,
        duration_minutes: 30,
        pace: "6:00/km",
        completed: false,
        feedback: nil,
        notes: "余裕を持って走る"
      )
    end
    it "deletes the specified training record" do
      delete "/training_records/#{training_record.id}"
      expect(response).to have_http_status(:no_content)
      expect(TrainingRecord.find_by(id: training_record.id)).to be_nil
    end
  end
  describe "GET /training_records/today" do
    context "when there is no training record for today" do
      it "returns nil for training_record" do
        get "/training_records/today"
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["training_record"]).to be_nil
      end
    end
  end
end
