export interface AuthData {
  username: string;
  email: string;
  password: string;
  repeatedPassword: string;
}

export enum AuthModeType {
  LOGIN = 'login',
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
  RESET_PASSWORD = 'reset-password',
  EMAIL_SENT = 'email-sent',
  TOKEN_ERROR = 'token-error',
}

export const modeToPathMap = new Map<AuthModeType, string>([
  [AuthModeType.LOGIN, 'login'],
  [AuthModeType.REGISTER, 'register'],
  [AuthModeType.FORGOT_PASSWORD, 'forgot-password'],
  [AuthModeType.RESET_PASSWORD, 'reset-password'],
  [AuthModeType.EMAIL_SENT, 'email-sent'],
  [AuthModeType.TOKEN_ERROR, 'token-error'],
]);
