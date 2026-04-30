class TrainingPlansController < ApplicationController
  def create
    profile = current_user.profile
    return render json: { error: "profile not found" }, status: :not_found unless profile

    result = ChatgptService.new.generate_training_plan(
      profile: profile,
      days: training_plan_params[:days],
      training_days: training_plan_params[:training_days],
      request_message: training_plan_params[:request_message]
    )

    render json: result, status: :ok
  rescue ChatgptService::Error => e
    render json: { error: e.message }, status: e.status || :unprocessable_entity
  end

  private

  def training_plan_params
    params.permit(:days, :request_message, training_days: [])
  end
end
