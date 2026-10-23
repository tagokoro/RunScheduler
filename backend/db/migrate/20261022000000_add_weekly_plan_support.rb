class AddWeeklyPlanSupport < ActiveRecord::Migration[8.1]
  def change
    add_column :profiles, :weekly_availability, :jsonb, null: false, default: {}
    create_table :training_plan_commits do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.uuid :proposal_id, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.timestamps
    end
    add_index :training_plan_commits, :proposal_id, unique: true
  end
end
