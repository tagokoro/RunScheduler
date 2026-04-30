class TrainingRecord < ApplicationRecord
  belongs_to :user

  validates :date, presence: true
  validates :training_type, presence: true
end
