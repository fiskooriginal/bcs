import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionsApi } from '@/api/executions';

export const useScriptExecutions = (scriptId: string) => {
  return useQuery({
    queryKey: ['scripts', scriptId, 'executions'],
    queryFn: () => executionsApi.getScriptExecutions(scriptId),
    enabled: !!scriptId,
  });
};

export const useExecutionLogs = (executionId: string) => {
  return useQuery({
    queryKey: ['executions', executionId, 'logs'],
    queryFn: () => executionsApi.getLogs(executionId),
    enabled: !!executionId,
  });
};

export const useStopExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (executionId: string) => executionsApi.stop(executionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
};
