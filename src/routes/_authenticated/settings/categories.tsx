import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-cube";
import { logActivity } from "@/lib/activity";
import * as api from "@/lib/api";

export const Route = createFileRoute("/_authenticated/settings/categories")({
  head: () => ({
    meta: [
      { title: "Cube — Expense categories" },
      {
        name: "description",
        content: "Add, rename and delete the categories Cube uses to group your expenses.",
      },
      { property: "og:title", content: "Cube — Expense categories" },
      { property: "og:description", content: "Manage your expense categories in Cube." },
    ],
  }),
  component: CategoriesPage,
});

const PALETTE = ["#e11d48", "#f97316", "#facc15", "#22c55e", "#38bdf8", "#a855f7", "#f472b6"];

function CategoriesPage() {
  const categories = useCategories();
  const queryClient = useQueryClient();
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const addCat = useMutation({
    mutationFn: async () => {
      const name = newCat.trim();
      if (!name) throw new Error("Name the category");
      const color = PALETTE[(categories.data?.length ?? 0) % PALETTE.length]!;
      await api.createCategory({ name, color });
      return name;
    },
    onSuccess: (name) => {
      invalidate();
      setNewCat("");
      void logActivity("category", `Added the category "${name}"`);
      toast.success("Category added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameCat = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateCategory(id, { name }),
    onSuccess: (_d, v) => {
      invalidate();
      setEditingId(null);
      void logActivity("category", `Renamed a category to "${v.name}"`);
      toast.success("Category renamed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCat = useMutation({
    mutationFn: async (cat: api.Category) => {
      await api.deleteCategory(cat.id);
      return cat.name;
    },
    onSuccess: (name) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void logActivity("category", `Deleted the category "${name}"`);
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <GlassCard className="space-y-3">
        <h1 className="text-lg uppercase tracking-[0.14em]">Categories</h1>
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
                    onClick={() => removeCat.mutate(c)}
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
    </div>
  );
}
