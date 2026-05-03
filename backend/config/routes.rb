Rails.application.routes.draw do
  mount Rswag::Api::Engine => "/api-docs"
  mount Rswag::Ui::Engine => "/api-docs"

  get "up" => "rails/health#show", as: :rails_health_check
  get "/health", to: "health#show"

  get "auth/:provider/callback", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  get "/me", to: "sessions#show"

  get "/me/profile", to: "profiles#show"
  patch "/me/profile", to: "profiles#update"
  get "/training_records", to: "training_records#index"
  post "/training_records", to: "training_records#create"
end
