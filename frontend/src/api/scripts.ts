import apiClient from './client';
import type { Script, ScriptUpdate } from '@/types';

export const scriptsApi = {
  getAll: async (): Promise<Script[]> => {
    const response = await apiClient.get<Script[]>('/scripts');
    return response.data;
  },

  getById: async (id: string): Promise<Script> => {
    const response = await apiClient.get<Script>(`/scripts/${id}`);
    return response.data;
  },

  update: async (id: string, data: ScriptUpdate): Promise<Script> => {
    const response = await apiClient.put<Script>(`/scripts/${id}`, data);
    return response.data;
  },

  getContent: async (id: string): Promise<string> => {
    const response = await apiClient.get<{ content: string }>(`/scripts/${id}/content`);
    return response.data.content;
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

  sync: async (): Promise<{ synced: number; removed: number }> => {
    const response = await apiClient.post<{ synced: number; removed: number }>('/scripts/sync');
    return response.data;
  },
};
