import { User } from './user.type';

export interface LoginSaveData {
  email: string;
  password: string;
}

export interface RegisterSaveData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  expiresIn: number;
  user: User;
}
export interface AuthResponseAfterRefresh {
  access: string;
  refresh: string;
  expiresIn: number;
}

export interface PasswordResetConfirmData {
  token: string;
  password: string;
}
