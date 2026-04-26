class ProfilesController < ApplicationController
  def update
    profile = current_user.profile || current_user.build_profile
    profile.update!(profile_params)
  end

  def show
    profile = current_user.profile

    render status: :not_found unless profile

    render json: {
      profile: {
        age: profile.age,
        weight: profile.weight.to_f,
        best_5k_seconds: profile.best_5k_seconds,
        best_half_seconds: profile.best_half_seconds,
        best_full_seconds: profile.best_full_seconds,
        target_race_type: profile.target_race_type,
        target_time_seconds: profile.target_time_seconds,
        race_date: profile.race_date
      }
    }, status: :ok
  end

  private

  def auth_hash
    request.env["omniauth.auth"]
  end

  def profile_params
    params.require(:profile).permit(
      :age,
      :weight,
      :best_5k_seconds,
      :best_half_seconds,
      :best_full_seconds,
      :target_race_type,
      :target_time_seconds,
      :race_date
    )
  end
end
