import { RouterPaths } from '../../_others/_helpers/router-paths';

export interface AuthData {
  username: string;
  email: string;
  password: string;
  repeatedPassword: string;
}

export enum AuthModeType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  FORGOT_PASSWORD_EMAIL_SENT = 'FORGOT_PASSWORD_EMAIL_SENT',
  RESET_PASSWORD = 'RESET_PASSWORD',
  TOKEN_ERROR = 'TOKEN_ERROR',
  REGISTER_EMAIL_SENT = 'REGISTER_EMAIL_SENT',
  CONFIRM_EMAIL_AFTER_REGISTER = 'CONFIRM_EMAIL_AFTER_REGISTER',
  FINISH_REGISTER_GOOGLE = 'FINISH_REGISTER_GOOGLE',
}

export const modeToPathMap = new Map<AuthModeType, string>([
  [AuthModeType.LOGIN, RouterPaths.AUTH_LOGIN],
  [AuthModeType.REGISTER, RouterPaths.AUTH_REGISTER],
  [AuthModeType.FORGOT_PASSWORD, RouterPaths.AUTH_FORGOT_PASSWORD],
  [AuthModeType.RESET_PASSWORD, RouterPaths.AUTH_RESET_PASSWORD],
  [AuthModeType.CONFIRM_EMAIL_AFTER_REGISTER, RouterPaths.CONFIRM_EMAIL_AFTER_REGISTER],
  [AuthModeType.FINISH_REGISTER_GOOGLE, RouterPaths.FINISH_REGISTER_GOOGLE],
]);
