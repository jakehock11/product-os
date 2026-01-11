import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/ipc';
import type { Settings, UpdateSettingsData } from '@/lib/types';

const SETTINGS_KEY = ['settings'];

// Get settings
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => api.settings.get(),
    staleTime: Infinity, // Settings rarely change from outside
  });
}

// Update settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsData) => api.settings.update(data),
    onSuccess: (settings) => {
      queryClient.setQueryData<Settings>(SETTINGS_KEY, settings);
    },
  });
}

// Change workspace folder
export function useChangeWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.settings.changeWorkspace(),
    onSuccess: (settings) => {
      if (settings) {
        queryClient.setQueryData<Settings>(SETTINGS_KEY, settings);
      }
    },
  });
}

// Open workspace folder
export function useOpenWorkspaceFolder() {
  return useMutation({
    mutationFn: () => api.settings.openWorkspaceFolder(),
  });
}

// Clear export history
export function useClearExportHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.settings.clearExportHistory(),
    onSuccess: () => {
      // Invalidate export history queries
      queryClient.invalidateQueries({ queryKey: ['exports', 'history'] });
    },
  });
}

// Clear all data (DANGER ZONE)
export function useClearAllData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.settings.clearAllData(),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['exports'] });
    },
  });
}
