FactoryBot.define do
  factory :user do
    name { "Test User" }
    email { "test@example.com" }
    image { "https://example.com/avatar.png" }
  end
end
