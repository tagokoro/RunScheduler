require "rails_helper"

RSpec.describe TrainingRecordStatsService do
  let(:user) { create(:user) }

  it "uses actuals, supports legacy completed plans, and excludes rest/uncompleted/other users for every grouping" do
    user.training_records.create!(date: Date.current - 1, training_type: "easy_run", completed: true,
      distance_km: 10, duration_minutes: 60, actual_distance_km: 6, actual_duration_minutes: 40)
    user.training_records.create!(date: Date.current, training_type: "easy_run", completed: true, distance_km: 5, duration_minutes: 30)
    user.training_records.create!(date: Date.current - 2, training_type: "rest", completed: true)
    user.training_records.create!(date: Date.tomorrow, training_type: "long_run", distance_km: 20, duration_minutes: 120)
    create(:user).training_records.create!(date: Date.current, training_type: "easy_run", completed: true, distance_km: 99)
    %w[day week month].each do |group_by|
      result = described_class.call(user: user, group_by: group_by).fetch(:stats)
      expect(result.sum { |row| row[:total_distance_km] }).to eq(11)
      expect(result.sum { |row| row[:total_duration_minutes] }).to eq(70)
      expect(result.sum { |row| row[:training_count] }).to eq(2)
    end
  end
end
