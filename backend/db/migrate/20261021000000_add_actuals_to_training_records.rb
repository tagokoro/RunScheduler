class AddActualsToTrainingRecords < ActiveRecord::Migration[8.1]
  def change
    add_column :training_records, :actual_distance_km, :decimal, precision: 5, scale: 2
    add_column :training_records, :actual_duration_minutes, :integer
  end
end
