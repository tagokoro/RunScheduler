class TrainingRecord < ApplicationRecord
  belongs_to :user

  validates :date, presence: true
  validates :training_type, presence: true
  validates :actual_distance_km, numericality: { greater_than_or_equal_to: 0, less_than: 1000 }, allow_nil: true
  validates :actual_duration_minutes, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1440 }, allow_nil: true
  validates :feedback, length: { maximum: 2000 }
  validate :completion_date_is_not_in_future

  private

  def completion_date_is_not_in_future
    if completed && date && date > Date.current
      errors.add(:completed, "cannot be recorded for a future date")
    end
  end
end
