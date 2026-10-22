class WeeklyPlansController < ApplicationController
  rescue_from WeeklyPlanService::Error, with: :render_plan_error
  rescue_from ChatgptService::Error, with: :render_plan_error

  def create
    if params.key?(:proposal_token) && (!params[:proposal_token].is_a?(String) || params[:proposal_token].blank?)
      return render json: { error: "提案を選び直してください。" }, status: :unprocessable_entity
    end
    render json: WeeklyPlanService.new(current_user).propose(params[:proposal_token])
  end

  def save
    token = params[:proposal_token]
    return render json: { error: "提案を選び直してください。" }, status: :unprocessable_entity unless token.is_a?(String) && token.bytesize <= WeeklyPlanService::MAX_TOKEN_BYTES
    render json: { training_records: WeeklyPlanService.new(current_user).commit(token) }
  end

  private

  def render_plan_error(error)
    render json: { error: error.message }, status: error.status || :unprocessable_entity
  end
end
