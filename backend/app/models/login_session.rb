require "digest"
require "securerandom"

class LoginSession < ApplicationRecord
  LIFETIME = 30.days
  COOKIE_NAME = Rails.env.production? ? "__Host-run_session" : "_run_session"

  belongs_to :user
  validates :token_digest, :expires_at, presence: true
  validates :token_digest, uniqueness: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.issue_for(user)
    token = SecureRandom.urlsafe_base64(32)
    login_session = create!(user: user, token_digest: digest(token), expires_at: LIFETIME.from_now)
    [ login_session, token ]
  end

  def self.authenticate(token)
    return unless token.is_a?(String) && token.match?(/\A[A-Za-z0-9_-]{43}\z/)

    active.find_by(token_digest: digest(token))
  end

  def self.digest(token)
    Digest::SHA256.hexdigest(token)
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end
