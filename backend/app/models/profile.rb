class Profile < ApplicationRecord
  include ActiveModel::Validations

  belongs_to :user

  TARGET_RACE_TYPES = %w[5k half full].freeze

  validates :age, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :weight, numericality: { greater_than: 0 }, allow_nil: true
  validates :best_5k_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :best_half_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :best_full_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :target_race_type,
    inclusion: {
      in: TARGET_RACE_TYPES,
      message: "is not included in the list"
    },
    allow_nil: true
  validates :target_time_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :is_valid_race_date

  private

  def is_valid_race_date
    return if race_date.blank?
    return unless race_date < Date.current
    errors.add(:race_date, "must be today or later")
  end
end
