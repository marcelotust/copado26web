/** Maps Supabase Auth errors to i18n keys — never expose raw messages in production UI. */

type AuthErrorLike = { code?: string; message?: string }

export function authErrorMessageKey(err: AuthErrorLike): string {
  switch (err.code) {
    case 'over_email_send_rate_limit':
    case 'email_rate_limit_exceeded':
      return 'errors.authRateLimit'
    case 'validation_failed':
    case 'invalid_credentials':
      return 'errors.authInvalid'
    case 'user_banned':
      return 'errors.authBanned'
    default:
      return 'errors.authGeneric'
  }
}
