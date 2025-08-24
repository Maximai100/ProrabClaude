import { Project, ProjectDetail, Client, Expense, ProjectPayment } from '../types/project';
import { api } from './api';

export const getProjects = async (params?: {
  status?: string;
  search?: string;
}): Promise<Project[]> => {
  const response = await api.get('/projects/', { params });
  return response.data; // DRF pagination returns results in the root
};

export const getProject = async (id: number): Promise<ProjectDetail> => {
  const response = await api.get(`/projects/${id}/`);
  return response.data;
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await api.post('/projects/', data);
  return response.data;
};

export const updateProject = async (id: number, data: Partial<Project>): Promise<Project> => {
  const response = await api.put(`/projects/${id}/`, data);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}/`);
};

// Клиенты
export const getClients = async (search?: string): Promise<Client[]> => {
  const response = await api.get('/projects/clients/', { params: { search } });
  return response.data;
};

export const createClient = async (data: Partial<Client>): Promise<Client> => {
  const response = await api.post('/projects/clients/', data);
  return response.data;
};

// Расходы
export const getExpenses = async (projectId: number): Promise<Expense[]> => {
  const response = await api.get(`/projects/${projectId}/expenses/`);
  return response.data;
};

export const createExpense = async (projectId: number, data: FormData): Promise<Expense> => {
  const response = await api.post(`/projects/${projectId}/expenses/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Платежи от клиентов
export const getProjectPayments = async (projectId: number): Promise<ProjectPayment[]> => {
  const response = await api.get(`/projects/${projectId}/payments/`);
  return response.data;
};

export const createProjectPayment = async (projectId: number, data: Partial<ProjectPayment>): Promise<ProjectPayment> => {
  const response = await api.post(`/projects/${projectId}/payments/`, data);
  return response.data;
};
