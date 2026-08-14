import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFxRates, useProfile, useSignedUrl } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { CURRENCIES } from "@/lib/format";
import { getLiveRates } from "@/lib/fx.functions";
import { CURRENCY_OPTIONS } from "@/lib/fx";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Cube — Your profile" },
      {
        name: "description",
        content:
          "Update your name, profile picture, email and password, and manage your base currency and exchange rates.",
      },
      { property: "og:title", content: "Cube — Your profile" },
      {
        property: "og:description",
        content: "Manage your Cube account details, currency and exchange rates.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useProfile();
  const queryClient = useQueryClient();
  const avatar = useSignedUrl("avatars", profile.data?.avatar_url);
  const base = profile.data?.currency ?? "PKR";
  const rates = useFxRates(base);
  const refresh = useServerFn(getLiveRates);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const currentEmail = useQuery({ queryKey: ["auth-email"], queryFn: api.currentEmail });

  useEffect(() => {
    setName(profile.data?.display_name ?? "");
  }, [profile.data?.display_name]);
  useEffect(() => {
    setEmail(currentEmail.data ?? "");
  }, [currentEmail.data]);

  const saveName = useMutation({
    mutationFn: () => api.updateProfile({ display_name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Name updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEmail = useMutation({
    mutationFn: () => api.updateEmail(email.trim()),
    onSuccess: () => toast.success("Check your new inbox to confirm the change"),
    onError: (e: Error) => toast.error(e.message),
  });

  const savePassword = useMutation({
    mutationFn: () => {
      if (password.length < 6) throw new Error("Use at least 6 characters");
      return api.updatePassword(password);
    },
    onSuccess: () => {
      setPassword("");
      toast.success("Password updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["signed-url"] });
      toast.success("Photo updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCurrency = useMutation({
    mutationFn: (value: string) => api.updateProfile({ currency: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Base currency updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refreshRates = useMutation({
    mutationFn: async () => {
      const res = await refresh({ data: { base, codes: [...CURRENCY_OPTIONS] } });
      await api.saveAutoRates(base, res.rates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fx-rates", base] });
      toast.success("Rates refreshed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setRate = useMutation({
    mutationFn: ({ code, rate }: { code: string; rate: number }) =>
      api.upsertFxRate({ base, code, rate, manual: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fx-rates", base] });
      toast.success("Rate saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRate = useMutation({
    mutationFn: (id: string) => api.deleteFxRate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fx-rates", base] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <GlassCard className="flex items-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-input/50">
            {avatar.data ? (
              <img
                src={avatar.data}
                alt="Your profile picture"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl">
                {(profile.data?.display_name ?? "C").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground">
            <Camera className="h-3.5 w-3.5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto.mutate(f);
              }}
            />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl uppercase tracking-[0.12em]">Profile</h1>
          <p className="truncate text-sm text-muted-foreground">{currentEmail.data}</p>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 bg-input/40"
          />
        </div>
        <Button onClick={() => saveName.mutate()} disabled={saveName.isPending}>
          Save name
        </Button>
      </GlassCard>

      <GlassCard className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-input/40"
          />
        </div>
        <Button onClick={() => saveEmail.mutate()} disabled={saveEmail.isPending}>
          Change email
        </Button>
        <div className="space-y-1.5 pt-2">
          <Label htmlFor="password">New password (optional)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-input/40"
            placeholder="••••••"
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => savePassword.mutate()}
          disabled={savePassword.isPending || !password}
        >
          Update password
        </Button>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg uppercase tracking-[0.14em]">Currency & rates</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refreshRates.mutate()}
            disabled={refreshRates.isPending}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Base currency</Label>
          <Select value={base} onValueChange={(v) => saveCurrency.mutate(v)}>
            <SelectTrigger className="h-11 bg-input/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          A rate is what one unit of that currency is worth in {base}. Edit any rate to override the
          automatic value.
        </p>

        <ul className="space-y-2">
          {CURRENCY_OPTIONS.filter((c) => c !== base).map((code) => {
            const row = rates.data?.find((r) => r.code === code);
            return (
              <li key={code} className="flex items-center gap-2">
                <span className="w-12 text-sm font-semibold">{code}</span>
                <Input
                  key={`${code}-${row?.rate ?? "none"}`}
                  defaultValue={row ? String(row.rate) : ""}
                  inputMode="decimal"
                  placeholder="—"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0 && v !== row?.rate) setRate.mutate({ code, rate: v });
                  }}
                  className="h-9 flex-1 bg-input/40"
                />
                {row?.manual && (
                  <button
                    aria-label={`Reset ${code} rate`}
                    onClick={() => removeRate.mutate(row.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </div>
  );
}
