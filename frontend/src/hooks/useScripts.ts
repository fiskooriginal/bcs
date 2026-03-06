import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { scriptsApi } from '@/api/scripts';
import type { ScriptUpdate } from '@/types';

export const useScripts = () => {
  return useQuery({
    queryKey: ['scripts'],
    queryFn: scriptsApi.getAll,
    placeholderData: keepPreviousData,
  });
};

export const useScript = (id: string) => {
  return useQuery({
    queryKey: ['scripts', id],
    queryFn: () => scriptsApi.getById(id),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
};

export const useScriptContent = (id: string) => {
  return useQuery({
    queryKey: ['scripts', id, 'content'],
    queryFn: () => scriptsApi.getContent(id),
    enabled: !!id,
  });
};

export const useUpdateScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScriptUpdate }) =>
      scriptsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      queryClient.invalidateQueries({ queryKey: ['scripts', variables.id] });
    },
  });
};

export const useActivateScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scriptsApi.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      queryClient.invalidateQueries({ queryKey: ['scripts', id] });
    },
  });
};

export const useDeactivateScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scriptsApi.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      queryClient.invalidateQueries({ queryKey: ['scripts', id] });
    },
  });
};

export const useRunScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scriptsApi.run(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['scripts', id, 'executions'] });
      queryClient.invalidateQueries({ queryKey: ['scripts', id, 'executions-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['scripts', id, 'executions-count'] });
    },
  });
};

export const useSyncScripts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scriptsApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });
};
