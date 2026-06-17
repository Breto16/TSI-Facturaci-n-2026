import apiClient from './apiClient';

export const loginRequest = async (usuario, password) => {
  const { data } = await apiClient.post('/usuarios/login', { usuario, password });
  return data;
};