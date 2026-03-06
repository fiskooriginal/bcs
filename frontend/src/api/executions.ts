import apiClient from './client';
import type { ScriptExecution, ScriptLog } from '@/types';

export const executionsApi = {
  getScriptExecutions: async (scriptId: string): Promise<ScriptExecution[]> => {
    const response = await apiClient.get<ScriptExecution[]>(`/scripts/${scriptId}/executions`);
    return response.data;
  },

  getLogs: async (executionId: string): Promise<ScriptLog[]> => {
    const response = await apiClient.get<ScriptLog[]>(`/executions/${executionId}/logs`);
    return response.data;
  },

  stop: async (executionId: string): Promise<void> => {
    await apiClient.post(`/executions/${executionId}/stop`);
  },
};
