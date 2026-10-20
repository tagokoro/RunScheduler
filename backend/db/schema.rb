# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_19_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "login_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", limit: 64, null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_login_sessions_on_expires_at"
    t.index ["token_digest"], name: "index_login_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_login_sessions_on_user_id"
  end

  create_table "profiles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.decimal "weight", precision: 4, scale: 1
    t.integer "age"
    t.integer "best_5k_seconds"
    t.integer "best_half_seconds"
    t.integer "best_full_seconds"
    t.text "target_race_type", null: false
    t.integer "target_time_seconds", null: false
    t.date "race_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_profiles_on_user_id", unique: true
  end

  create_table "training_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.text "training_type", null: false
    t.text "description"
    t.decimal "distance_km", precision: 5, scale: 2
    t.integer "duration_minutes"
    t.text "pace"
    t.boolean "completed", default: false
    t.text "feedback"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_training_records_on_date"
    t.index ["user_id", "date"], name: "index_training_records_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_training_records_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "image"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "login_sessions", "users", on_delete: :cascade
  add_foreign_key "profiles", "users", on_delete: :cascade
  add_foreign_key "training_records", "users", on_delete: :cascade
end
