import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useProfile } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import {
  applyTheme,
  readStoredTheme,
  storeTheme,
  isThemeName,
  type ThemeName,
} from "@/lib/theme";

/** Applies the stored theme immediately, then reconciles with the saved profile theme. */
export function useTheme() {
  const profile = useProfile();
  const queryClient = useQueryClient();
  const saved = isThemeName(profile.data?.theme) ? profile.data.theme : null;

  useEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (!saved) return;
    storeTheme(saved);
    applyTheme(saved);
  }, [saved]);

  const setTheme = useMutation({
    mutationFn: async (name: ThemeName) => {
      storeTheme(name);
      applyTheme(name);
      await api.updateProfile({ theme: name });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  return { theme: saved ?? readStoredTheme(), setTheme };
}
