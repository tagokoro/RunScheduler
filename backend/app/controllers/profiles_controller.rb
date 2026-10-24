class ProfilesController < ApplicationController
  def update
    if params.key?(:weekly_availability) && !params[:weekly_availability].is_a?(ActionController::Parameters)
      return render json: { error: "普段の練習スケジュールは曜日ごとに指定してください。" }, status: :unprocessable_entity
    end
    current_user.with_lock do
      profile = current_user.profile || current_user.build_profile
      if profile.update(profile_params)
        head :no_content
      else
        render json: { errors: profile.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  def show
    profile = current_user.profile

    return render json: { error: "profile not found" }, status: :not_found unless profile

    render json: {
      age: profile.age,
      weight: profile.weight&.to_f,
      best_5k_seconds: profile.best_5k_seconds,
      best_half_seconds: profile.best_half_seconds,
      best_full_seconds: profile.best_full_seconds,
      target_race_type: profile.target_race_type,
      target_time_seconds: profile.target_time_seconds,
      race_date: profile.race_date,
      weekly_availability: profile.weekly_availability
    }, status: :ok
  end

  private

  def profile_params
    params.permit(
      :age,
      :weight,
      :best_5k_seconds,
      :best_half_seconds,
      :best_full_seconds,
      :target_race_type,
      :target_time_seconds,
      :race_date,
      weekly_availability: {}
    )
  end
end
