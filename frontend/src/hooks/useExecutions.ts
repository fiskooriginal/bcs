import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { executionsApi } from '@/api/executions';

export const useScriptExecutions = (scriptId: string) => {
  return useQuery({
    queryKey: ['scripts', scriptId, 'executions'],
    queryFn: () => executionsApi.getScriptExecutions(scriptId),
    enabled: !!scriptId,
    placeholderData: keepPreviousData,
  });
};

export const useScriptExecutionsCount = (scriptId: string) => {
  return useQuery({
    queryKey: ['scripts', scriptId, 'executions-count'],
    queryFn: () => executionsApi.getExecutionsCount(scriptId),
    enabled: !!scriptId,
    placeholderData: keepPreviousData,
  });
};

export const useScriptExecutionsInfinite = (scriptId: string) => {
  return useInfiniteQuery({
    queryKey: ['scripts', scriptId, 'executions-infinite'],
    queryFn: ({ pageParam }) =>
      executionsApi.getScriptExecutionsPage(scriptId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < executionsApi.pageSize()) {
        return undefined;
      }
      return allPages.length;
    },
    enabled: !!scriptId,
    placeholderData: keepPreviousData,
  });
};

export const useExecution = (executionId: string) => {
  return useQuery({
    queryKey: ['executions', executionId],
    queryFn: () => executionsApi.getExecution(executionId),
    enabled: !!executionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' || status === 'pending' ? 2000 : false;
    },
  });
};

export const useExecutionLogs = (executionId: string) => {
  return useQuery({
    queryKey: ['executions', executionId, 'logs'],
    queryFn: () => executionsApi.getLogs(executionId),
    enabled: !!executionId,
  });
};

export const useStopExecution = (scriptId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (executionId: string) => executionsApi.stop(executionId),
    onSuccess: (_, executionId) => {
      queryClient.invalidateQueries({ queryKey: ['executions', executionId] });
      queryClient.invalidateQueries({ queryKey: ['executions', executionId, 'logs'] });
      if (scriptId) {
        queryClient.invalidateQueries({ queryKey: ['scripts', scriptId, 'executions'] });
        queryClient.invalidateQueries({ queryKey: ['scripts', scriptId, 'executions-infinite'] });
      }
    },
  });
};
