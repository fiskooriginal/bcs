import apiClient from './client';
import type { Script, ScriptCreate, ScriptUpdate } from '@/types';

export const scriptsApi = {
  getAll: async (): Promise<Script[]> => {
    const response = await apiClient.get<Script[]>('/scripts');
    return response.data;
  },

  getById: async (id: string): Promise<Script> => {
    const response = await apiClient.get<Script>(`/scripts/${id}`);
    return response.data;
  },

  create: async (data: ScriptCreate): Promise<Script> => {
    const response = await apiClient.post<Script>('/scripts', data);
    return response.data;
  },

  update: async (id: string, data: ScriptUpdate): Promise<Script> => {
    const response = await apiClient.put<Script>(`/scripts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/scripts/${id}`);
  },

  getContent: async (id: string): Promise<string> => {
    const response = await apiClient.get<{ content: string }>(`/scripts/${id}/content`);
    return response.data.content;
  },

  updateContent: async (id: string, content: string): Promise<void> => {
    await apiClient.put(`/scripts/${id}/content`, { content });
  },

  importFile: async (file: File): Promise<Script> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<Script>('/scripts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  activate: async (id: string): Promise<void> => {
    await apiClient.post(`/scripts/${id}/activate`);
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.post(`/scripts/${id}/deactivate`);
  },

  run: async (id: string): Promise<{ execution_id: string }> => {
    const response = await apiClient.post<{ execution_id: string }>(`/scripts/${id}/run`);
    return response.data;
  },
};
