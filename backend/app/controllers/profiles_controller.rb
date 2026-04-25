class ProfilesController < ApplicationController
  def update
    profile = current_user.profile || current_user.build_profile
    profile.update!(profile_params)
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
