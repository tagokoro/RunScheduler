Rails.application.routes.draw do
  mount Rswag::Api::Engine => "/api-docs"
  mount Rswag::Ui::Engine => "/api-docs"

  get "up" => "rails/health#show", as: :rails_health_check
  get "/health", to: "health#show"

  get "auth/:provider/callback", to: "sessions#create"
  get "/csrf", to: "sessions#csrf"
  delete "/logout", to: "sessions#destroy"
  get "/me", to: "sessions#show"

  get "/me/profile", to: "profiles#show"
  patch "/me/profile", to: "profiles#update"
  get "/training_records", to: "training_records#index"
  post "/training_records", to: "training_records#create"
  get "/training_records/stats", to: "training_records#stats"
  get "/training_records/today", to: "training_records#today"
  delete "/training_records/:id", to: "training_records#destroy"
  patch "/training_records/:id", to: "training_records#update"
end
