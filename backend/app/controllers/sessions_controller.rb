class SessionsController < ApplicationController
  FRONTEND_URL = ENV.fetch("FRONTEND_URL", "http://localhost:3001").freeze

  skip_before_action :check_logged_in, only: [ :create, :csrf ]

  def csrf
    response.headers["Cache-Control"] = "no-store"
    render json: { csrf_token: form_authenticity_token }
  end

  def show
    render json: {
      user: {
        id: current_user.id,
        name: current_user.name,
        email: current_user.email,
        image: current_user.image
      }
    }
  end
  def create
    user = User.find_or_create_from_auth_hash(auth_hash)

    return render json: { error: "unauthorized" }, status: :unauthorized unless user

    log_in user

    redirect_to FRONTEND_URL, allow_other_host: true
  end

  def destroy
    log_out
    head :no_content
  end

  private

  def auth_hash
    request.env["omniauth.auth"]
  end
end
