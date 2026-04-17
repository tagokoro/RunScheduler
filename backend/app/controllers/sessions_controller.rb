class SessionsController < ApplicationController
  skip_before_action :check_logged_in, only: :create

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

    redirect_to "http://localhost:3001/", allow_other_host: true # TODO FRONTEND_URLに分ける
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
