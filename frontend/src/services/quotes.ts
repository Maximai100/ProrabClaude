import { Quote, QuoteItem, CatalogItem } from '../types/quote';
import { api } from './api';

export const getQuotes = async (projectId: number): Promise<Quote[]> => {
  const response = await api.get(`/quotes/projects/${projectId}/quotes/`);
  return response.data;
};

export const getQuote = async (id: number): Promise<Quote> => {
  const response = await api.get(`/quotes/${id}/`);
  return response.data;
};

export const createQuote = async (data: { title: string; notes?: string; project_id: number }): Promise<Quote> => {
  const response = await api.post(`/quotes/projects/${data.project_id}/quotes/`, data);
  return response.data;
};

export const updateQuote = async (id: number, data: Partial<Quote>): Promise<Quote> => {
  const response = await api.put(`/quotes/${id}/`, data);
  return response.data;
};

export const deleteQuote = async (id: number): Promise<void> => {
  await api.delete(`/quotes/${id}/`);
};

// Позиции сметы
export const getQuoteItems = async (quoteId: number): Promise<QuoteItem[]> => {
  const response = await api.get(`/quotes/${quoteId}/items/`);
  return response.data;
};

export const createQuoteItem = async (quoteId: number, data: Partial<QuoteItem>): Promise<QuoteItem> => {
  const response = await api.post(`/quotes/${quoteId}/items/`, data);
  return response.data;
};

export const updateQuoteItem = async (id: number, data: Partial<QuoteItem>): Promise<QuoteItem> => {
  const response = await api.put(`/quotes/items/${id}/`, data);
  return response.data;
};

export const deleteQuoteItem = async (id: number): Promise<void> => {
  await api.delete(`/quotes/items/${id}/`);
};

// Справочник пользователя
export const getCatalogItems = async (params?: {
  search?: string;
  type?: 'work' | 'material';
}): Promise<CatalogItem[]> => {
  const response = await api.get('/quotes/catalog/', { params });
  return response.data;
};
