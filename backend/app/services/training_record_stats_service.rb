class TrainingRecordStatsService
  GROUPING_CONFIG = {
    "day" => {
      sql: "DATE(date)",
      formatter: ->(date) { date.to_s }
    },
    "week" => {
      sql: "DATE_TRUNC('week', date)",
      formatter: ->(date) { date.to_date.to_s }
    },
    "month" => {
      sql: "DATE_TRUNC('month', date)",
      formatter: ->(date) { date.to_date.strftime("%Y-%m") }
    }
  }.freeze

  def self.call(user:, group_by:)
    new(user: user, group_by: group_by).call
  end

  def initialize(user:, group_by:)
    @user = user
    @group_by = group_by.presence || "day"
  end

  def call
    return { error: "Invalid group_by parameter" } unless GROUPING_CONFIG.key?(group_by)

    {
      group_by: group_by,
      stats: build_stats
    }
  end

  private

  attr_reader :user, :group_by

  def build_stats
    config = GROUPING_CONFIG[group_by]
    period_sql = Arel.sql(config[:sql])

    user.training_records
      .where(completed: true)
      .where.not(training_type: "rest")
      .group(period_sql)
      .order(period_sql)
      .pluck(
        period_sql,
        Arel.sql("COALESCE(SUM(COALESCE(actual_distance_km, distance_km)), 0)"),
        Arel.sql("COALESCE(SUM(COALESCE(actual_duration_minutes, duration_minutes)), 0)"),
        Arel.sql("COUNT(*)")
      )
      .map do |period, distance, duration, count|
        {
          period: config[:formatter].call(period),
          total_distance_km: distance.to_f,
          total_duration_minutes: duration.to_i,
          training_count: count.to_i
        }
      end
  end
end
