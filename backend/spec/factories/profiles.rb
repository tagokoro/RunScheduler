FactoryBot.define do
  factory :profile do
    association :user
    age { 30 }
    weight { 60.0 }
    best_5k_seconds { 1200 }
    best_half_seconds { 7200 }
    best_full_seconds { 15120 }
    target_race_type  { "half" }
    target_time_seconds { 7200 }
    race_date { "2026-12-01" }
  end
end
