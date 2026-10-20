class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection
  include SessionsHelper
  before_action :prevent_shared_cache
  before_action :check_logged_in
  protect_from_forgery with: :exception

  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { error: "invalid CSRF token or origin" }, status: :forbidden
  end

  def check_logged_in
    return if current_user

    render json: { error: "unauthorized" }, status: :unauthorized
  end

  private

  def prevent_shared_cache
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["CDN-Cache-Control"] = "no-store"
    response.headers["Vercel-CDN-Cache-Control"] = "no-store"
  end

  def valid_request_origin?
    WebSecurity.valid_origin?(request)
  end
end
