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
  user: User;
}
