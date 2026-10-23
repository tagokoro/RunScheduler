class Profile < ApplicationRecord
  belongs_to :user

  WEEKDAYS = %w[monday tuesday wednesday thursday friday saturday sunday].freeze

  TARGET_RACE_TYPES = %w[5k half full].freeze

  validates :age, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 120 }
  validates :weight, presence: true, numericality: { greater_than: 0, less_than: 1000 }
  validates :best_5k_seconds, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :best_half_seconds, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :best_full_seconds, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :target_race_type,
    presence: true,
    inclusion: {
      in: TARGET_RACE_TYPES,
      message: "is not included in the list"
    }
  validates :target_time_seconds, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :race_date, presence: true
  validate :valid_weekly_availability
  validate :is_valid_race_date

  def schedule_configured?
    weekly_availability.is_a?(Hash) && WEEKDAYS.all? { |day| weekly_availability[day].is_a?(Integer) }
  end

  def available_minutes(date)
    weekly_availability[date.strftime("%A").downcase]
  end

  private

  def valid_weekly_availability
    schedule = weekly_availability
    unless schedule.is_a?(Hash) && (schedule.keys - WEEKDAYS).empty? &&
        schedule.values.all? { |minutes| minutes.nil? || (minutes.is_a?(Integer) && (0..1440).cover?(minutes)) }
      errors.add(:weekly_availability, "は曜日ごとに未設定、休み（0）、または1〜1440分の整数で指定してください。")
    end
  end

  def is_valid_race_date
    return if race_date.blank?
    return unless race_date < Date.current
    errors.add(:race_date, "must be today or later")
  end
end
