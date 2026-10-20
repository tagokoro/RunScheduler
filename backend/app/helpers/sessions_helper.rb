module SessionsHelper
  def current_user
    current_login_session&.user
  end

  def current_login_session
    return @current_login_session if defined?(@current_login_session)

    @current_login_session = LoginSession.authenticate(cookies[LoginSession::COOKIE_NAME])
  end

  def log_in(user)
    current_login_session&.revoke!
    reset_session
    @current_login_session, token = LoginSession.issue_for(user)
    cookies[LoginSession::COOKIE_NAME] = WebSecurity.cookie_options.merge(
      value: token, expires: @current_login_session.expires_at
    )
  end

  def log_out
    current_login_session&.revoke!
    cookies.delete(LoginSession::COOKIE_NAME, **WebSecurity.cookie_options)
    reset_session
    @current_login_session = nil
  end
end
