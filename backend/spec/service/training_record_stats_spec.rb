 require "rails_helper"

  RSpec.describe TrainingRecordStatsService, type: :service do
    let(:user) { create(:user) }

    describe ".call" do
      context "when group_by is day" do
        before do
          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 1),
            training_type: "easy_run",
            description: "30分",
            distance_km: 5.0,
            duration_minutes: 30,
            pace: "6:00/km",
            completed: true,
            feedback: nil,
            notes: ""
          )

          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 2),
            training_type: "tempo",
            description: "40分",
            distance_km: 8.0,
            duration_minutes: 40,
            pace: "5:00/km",
            completed: true,
            feedback: nil,
            notes: ""
          )
        end

        it "returns daily aggregated stats" do
          result = described_class.call(user: user, group_by: "day")

          expect(result[:group_by]).to eq("day")
          expect(result[:stats]).to eq([
            {
              period: "2026-05-01",
              total_distance_km: 5.0,
              total_duration_minutes: 30,
              training_count: 1
            },
            {
              period: "2026-05-02",
              total_distance_km: 8.0,
              total_duration_minutes: 40,
              training_count: 1
            }
          ])
        end
      end
      context "when group_by is week" do
        before do
          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 4), # same week
            training_type: "easy_run",
            description: "30分",
            distance_km: 5.0,
            duration_minutes: 30,
            pace: "6:00/km",
            completed: true,
            feedback: nil,
            notes: ""
          )

          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 6), # same week
            training_type: "tempo",
            description: "40分",
            distance_km: 8.0,
            duration_minutes: 40,
            pace: "5:00/km",
            completed: true,
            feedback: nil,
            notes: ""
          )
        end

        it "returns weekly aggregated stats" do
          result = described_class.call(user: user, group_by: "week")

          expect(result[:group_by]).to eq("week")
          expect(result[:stats]).to eq([
            {
              period: "2026-05-04",
              total_distance_km: 13.0,
              total_duration_minutes: 70,
              training_count: 2
            }
          ])
        end
      end

      context "when group_by is month" do
        before do
          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 1),
            training_type: "easy_run",
            description: "30分",
            distance_km: 5.0,
            duration_minutes: 30,
            pace: "6:00/km",
            completed: true,
            feedback: nil,
            notes: ""
          )

          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 5, 20),
            training_type: "long_run",
            description: "80分",
            distance_km: 15.0,
            duration_minutes: 80,
            pace: "5:20/km",
            completed: true,
            feedback: nil,
            notes: ""
          )

          TrainingRecord.create!(
            user: user,
            date: Date.new(2026, 6, 3),
            training_type: "recovery_run",
            description: "25分",
            distance_km: 4.0,
            duration_minutes: 25,
            pace: "6:15/km",
            completed: true,
            feedback: nil,
            notes: ""
          )
        end

        it "returns monthly aggregated stats" do
          result = described_class.call(user: user, group_by: "month")

          expect(result[:group_by]).to eq("month")
          expect(result[:stats]).to eq([
            {
              period: "2026-05",
              total_distance_km: 20.0,
              total_duration_minutes: 110,
              training_count: 2
            },
            {
              period: "2026-06",
              total_distance_km: 4.0,
              total_duration_minutes: 25,
              training_count: 1
            }
          ])
        end
      end
    end
  end
