class CreateProfilesAndTrainingRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :profiles, id: :uuid do |t|
      t.references :user,
                    null: false,
                    foreign_key: { on_delete: :cascade },
                    index: { unique: true }
      t.decimal :weight, precision: 4, scale: 1
      t.integer :age
      t.integer :best_5k_seconds
      t.integer :best_half_seconds
      t.integer :best_full_seconds
      t.text :target_race_type, null: false
      t.integer :target_time_seconds, null: false
      t.date :race_date, null: false

      t.timestamps
    end

    create_table :training_records, id: :uuid do |t|
      t.references :user,
                    null: false,
                    foreign_key: { on_delete: :cascade }
      t.date :date, null: false
      t.text :traning_type, null: false
      t.text :description
      t.decimal :distance_km, precision: 5, scale: 2
      t.integer :duration_minutes
      t.text :pace
      t.boolean :complated, default: false
      t.text :feedback
      t.text :notes

      t.timestamps
    end

    add_index :training_records, [:user_id, :date], unique: true
    add_index :training_records, :date
  end
end
