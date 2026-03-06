import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '@/api/scripts';
import type { ScriptCreate, ScriptUpdate } from '@/types';

export const useScripts = () => {
  return useQuery({
    queryKey: ['scripts'],
    queryFn: scriptsApi.getAll,
  });
};

export const useScript = (id: string) => {
  return useQuery({
    queryKey: ['scripts', id],
    queryFn: () => scriptsApi.getById(id),
    enabled: !!id,
  });
};

export const useScriptContent = (id: string) => {
  return useQuery({
    queryKey: ['scripts', id, 'content'],
    queryFn: () => scriptsApi.getContent(id),
    enabled: !!id,
  });
};

export const useCreateScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScriptCreate) => scriptsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
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

export const useUpdateScriptContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      scriptsApi.updateContent(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scripts', variables.id, 'content'] });
    },
  });
};

export const useDeleteScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scriptsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });
};

export const useImportScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => scriptsApi.importFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
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
    },
  });
};
