import { AuthResponse, LoginData, RegisterData, User } from '../types/auth';
import { api } from './api';

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login/', data);
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.put('/auth/profile/', data);
  return response.data;
};
