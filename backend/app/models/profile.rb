class Profile < ApplicationRecord
  belongs_to :user

  TARGET_RACE_TYPES = %w[5k half full].freeze

  validates :age, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :weight, numericality: { greater_than: 0 }, allow_nil: true
  validates :best_5k_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :best_half_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :best_full_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :target_race_type,
    presence: true,
    inclusion: {
      in: TARGET_RACE_TYPES,
      message: "is not included in the list"
    }
  validates :target_time_seconds, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :is_valid_race_date

  private

  def is_valid_race_date
    return if race_date.blank?
    return unless race_date < Date.current
    errors.add(:race_date, "must be today or later")
  end
end
