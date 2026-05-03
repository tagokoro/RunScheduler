class TrainingRecordsController < ApplicationController
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

  private

  def training_record_params
    params.permit(:days, :request_message, training_days: [])
  end

  def save_training_records!(training_records)
    ActiveRecord::Base.transaction do
      training_records.map do |record|
        training_record = current_user.training_records.find_or_initialize_by(
          date: record["date"]
        )

        training_record.assign_attributes(
          training_type: record["training_type"],
          description: record["description"],
          distance_km: record["distance_km"],
          duration_minutes: record["duration_minutes"],
          pace: record["pace"],
          completed: record["completed"],
          feedback: record["feedback"],
          notes: record["notes"]
        )
        training_record.save!
        serialize_training_record(training_record)
      end
    end
  end

  def serialize_training_record(training_record)
    {
      id: training_record.id,
      date: training_record.date,
      training_type: training_record.training_type,
      description: training_record.description,
      distance_km: training_record.distance_km&.to_f,
      duration_minutes: training_record.duration_minutes,
      pace: training_record.pace,
      completed: training_record.completed,
      feedback: training_record.feedback,
      notes: training_record.notes
    }
  end
end
