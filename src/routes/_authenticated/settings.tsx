import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Pencil, Plus, Repeat, Trash2, X } from "lucide-react";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useCategories, useProfile, useRecurring } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { CURRENCIES, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Cube — Settings & categories" },
      {
        name: "description",
        content:
          "Rename categories, add new ones, set your currency and manage recurring monthly expenses.",
      },
      { property: "og:title", content: "Cube — Settings & categories" },
      {
        property: "og:description",
        content: "Manage categories, currency and recurring expenses in Cube.",
      },
    ],
  }),
  component: SettingsPage,
});

const PALETTE = ["#e11d48", "#f97316", "#facc15", "#22c55e", "#38bdf8", "#a855f7", "#f472b6"];

function SettingsPage() {
  const profile = useProfile();
  const categories = useCategories();
  const recurring = useRecurring();
  const queryClient = useQueryClient();

  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const currency = profile.data?.currency ?? "PKR";

  const saveCurrency = useMutation({
    mutationFn: (value: string) => api.updateProfile({ currency: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Currency updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invalidateCats = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const addCat = useMutation({
    mutationFn: async () => {
      if (!newCat.trim()) throw new Error("Name the category");
      const color = PALETTE[(categories.data?.length ?? 0) % PALETTE.length]!;
      await api.createCategory({ name: newCat.trim(), color });
    },
    onSuccess: () => {
      invalidateCats();
      setNewCat("");
      toast.success("Category added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameCat = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.updateCategory(id, { name }),
    onSuccess: () => {
      invalidateCats();
      setEditingId(null);
      toast.success("Category renamed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCat = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      invalidateCats();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invalidateRecurring = () => queryClient.invalidateQueries({ queryKey: ["recurring"] });

  const [recLabel, setRecLabel] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recDay, setRecDay] = useState("1");
  const [recCat, setRecCat] = useState<string | null>(null);

  const addRecurring = useMutation({
    mutationFn: async () => {
      const value = Number(recAmount);
      if (!recLabel.trim()) throw new Error("Name the recurring expense");
      if (!value || value <= 0) throw new Error("Enter an amount");
      await api.createRecurring({
        label: recLabel.trim(),
        amount: value,
        category_id: recCat ?? categories.data?.[0]?.id ?? null,
        day_of_month: Math.min(28, Math.max(1, Number(recDay) || 1)),
        active: true,
      });
    },
    onSuccess: () => {
      invalidateRecurring();
      setRecLabel("");
      setRecAmount("");
      toast.success("Recurring expense added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRecurring = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.updateRecurring(id, { active }),
    onSuccess: invalidateRecurring,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRecurring = useMutation({
    mutationFn: (id: string) => api.deleteRecurring(id),
    onSuccess: () => {
      invalidateRecurring();
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-3">
        <h2 className="text-lg uppercase tracking-[0.14em]">Currency</h2>
        <Select value={currency} onValueChange={(v) => saveCurrency.mutate(v)}>
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
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="text-lg uppercase tracking-[0.14em]">Categories</h2>
        <ul className="divide-y divide-border">
          {(categories.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {editingId === c.id ? (
                <>
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 flex-1 bg-input/40"
                  />
                  <button
                    aria-label="Save name"
                    onClick={() => renameCat.mutate({ id: c.id, name: editName.trim() })}
                    className="rounded-full p-1.5 hover:bg-primary/25"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Cancel"
                    onClick={() => setEditingId(null)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    aria-label={`Rename ${c.name}`}
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label={`Delete ${c.name}`}
                    onClick={() => removeCat.mutate(c.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCat.mutate();
          }}
        >
          <Input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category"
            className="h-11 bg-input/40"
          />
          <Button type="submit" className="h-11">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg uppercase tracking-[0.14em]">
          <Repeat className="h-4 w-4 text-primary" /> Recurring
        </h2>
        <p className="text-sm text-muted-foreground">
          Each new month, Cube asks before adding these to your expenses.
        </p>
        <ul className="divide-y divide-border">
          {(recurring.data ?? []).map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(r.amount, currency)} · day {r.day_of_month}
                </p>
              </div>
              <Switch
                checked={r.active}
                onCheckedChange={(v) => toggleRecurring.mutate({ id: r.id, active: v })}
                aria-label={`Toggle ${r.label}`}
              />
              <button
                aria-label={`Delete ${r.label}`}
                onClick={() => removeRecurring.mutate(r.id)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            addRecurring.mutate();
          }}
        >
          <Input
            value={recLabel}
            onChange={(e) => setRecLabel(e.target.value)}
            placeholder="e.g. Rent"
            className="h-11 bg-input/40"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                className="h-11 bg-input/40"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Day of month</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={recDay}
                onChange={(e) => setRecDay(e.target.value)}
                className="h-11 bg-input/40"
              />
            </div>
          </div>
          <Select
            value={recCat ?? categories.data?.[0]?.id ?? ""}
            onValueChange={(v) => setRecCat(v)}
          >
            <SelectTrigger className="h-11 bg-input/40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" className="h-11 w-full">
            <Plus className="mr-1 h-4 w-4" /> Add recurring
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
