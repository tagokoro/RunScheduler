class TrainingRecordsController < ApplicationController
  around_action :lock_record_writes, only: [ :update, :destroy ]

  def index
    training_records = current_user.training_records.order(:date)

    render json: {
      training_records: training_records.map { |training_record| serialize_training_record(training_record) }
    }, status: :ok
  end

  def create
    profile = current_user.profile
    return render json: { error: "profile not found" }, status: :not_found unless profile

    result = ChatgptService.new.generate_training_records(
      profile: profile,
      days: training_record_params[:days],
      training_days: training_record_params[:training_days],
      request_message: training_record_params[:request_message]
    )

    saved_records = save_training_records!(result["training_records"])

    render json: { training_records: saved_records }, status: :ok
  rescue ChatgptService::Error => e
    render json: { error: e.message }, status: e.status || :unprocessable_entity
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.record.errors.full_messages.join(", ") }, status: :unprocessable_entity
  end

  def destroy
    training_record = current_user.training_records.find_by(id: params[:id])
    return render json: { error: "training record not found" }, status: :not_found unless training_record

    training_record.destroy
    head :no_content
  end

  def update
    training_record = current_user.training_records.find_by(id: params[:id])
    return render json: { error: "training record not found" }, status: :not_found unless training_record

    if training_record.update(params.permit(:completed, :actual_distance_km, :actual_duration_minutes, :feedback))
      render json: { training_record: serialize_training_record(training_record) }, status: :ok
    else
      render json: { error: training_record.errors.full_messages.join(", ") }, status: :unprocessable_entity
    end
  end
  def today
    today_record = current_user.training_records.find_by(date: Date.current)

    render json: {
      training_record: today_record ? serialize_training_record(today_record) : nil
    }, status: :ok
  end
  def stats
    result = TrainingRecordStatsService.call(
      user: current_user,
      group_by: params[:group_by]
    )

    if result[:error]
      render json: { error: result[:error] }, status: :bad_request
    else
      render json: result, status: :ok
    end
  end

  private

  def training_record_params
    params.permit(:completed, :days, :request_message, training_days: [])
  end

  def save_training_records!(training_records)
    current_user.with_lock do
      training_records.map do |record|
        training_record = current_user.training_records.lock.find_or_initialize_by(
          date: record["date"]
        )

        # Regeneration must never erase a runner's recorded activity or reflection.
        next serialize_training_record(training_record) if training_record.persisted? && training_record.activity_recorded?

        training_record.assign_attributes(
          training_type: record["training_type"],
          description: record["description"],
          distance_km: record["distance_km"],
          duration_minutes: record["duration_minutes"],
          pace: record["pace"],
          completed: false,
          notes: record["notes"]
        )
        training_record.save!
        serialize_training_record(training_record)
      end
    end
  end

  def serialize_training_record(training_record)
    training_record.api_attributes
  end

  def lock_record_writes(&action)
    current_user.with_lock(&action)
  end
end
