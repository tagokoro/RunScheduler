class ApplicationController < ActionController::API
  include SessionsHelper
  before_action :check_logged_in

  def check_logged_in
    return if current_user

    render json: { error: "unauthorized" }, status: :unauthorized
  end
end
