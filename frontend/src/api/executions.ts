import apiClient from './client';
import type { ScriptExecution, ScriptLog } from '@/types';

const PAGE_SIZE = 20;

export const executionsApi = {
  getExecution: async (executionId: string): Promise<ScriptExecution> => {
    const response = await apiClient.get<ScriptExecution>(
      `/executions/${executionId}`
    );
    return response.data;
  },
  getScriptExecutions: async (
    scriptId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<ScriptExecution[]> => {
    const response = await apiClient.get<ScriptExecution[]>(
      `/scripts/${scriptId}/executions`,
      { params }
    );
    return response.data;
  },

  getScriptExecutionsPage: async (
    scriptId: string,
    page: number
  ): Promise<ScriptExecution[]> => {
    return executionsApi.getScriptExecutions(scriptId, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
  },

  pageSize: () => PAGE_SIZE,

  getExecutionsCount: async (scriptId: string): Promise<{ total: number }> => {
    const response = await apiClient.get<{ total: number }>(
      `/scripts/${scriptId}/executions/count`
    );
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
