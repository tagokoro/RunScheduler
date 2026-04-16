class HealthController < ApplicationController
  skip_before_action :check_logged_in, only: :show
  def show
    render json: { status: "ok" }
  end
end
