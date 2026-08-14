import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ImagePlus, Loader2, ScanLine, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AmountField } from "@/components/AmountField";
import { Button } from "@/components/ui/button";
import { OFFLINE_NEEDS_NET, useOfflineStatus } from "@/lib/offline";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories, useCurrency, useFxRates } from "@/hooks/use-cube";
import { scanReceipt } from "@/lib/ai.functions";
import * as api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { rateFor, toBase } from "@/lib/fx";
import { cn } from "@/lib/utils";

type DraftItem = {
  name: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  need_want: "need" | "want";
  reason: string;
};

/** Shrinks a photo so the AI call stays small and fast. */
async function toDataUrl(file: File, max = 1400) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the image");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function ReceiptScanner({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const categories = useCategories();
  const base = useCurrency();
  const rates = useFxRates(base);
  const queryClient = useQueryClient();
  const runScan = useServerFn(scanReceipt);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(todayISO());
  const [total, setTotal] = useState("");
  const [currency, setCurrency] = useState(base);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [scanned, setScanned] = useState(false);

  function reset() {
    setFile(null);
    setMerchant("");
    setDate(todayISO());
    setTotal("");
    setCurrency(base);
    setCategoryId(null);
    setItems([]);
    setScanned(false);
  }

  const offline = useOfflineStatus();
  const scan = useMutation({
    mutationFn: async (picked: File) => {
      const dataUrl = await toDataUrl(picked);
      const names = (categories.data ?? []).map((c) => c.name);
      return runScan({ data: { imageDataUrl: dataUrl, categories: names } });
    },
    onSuccess: (res) => {
      setMerchant(res.merchant ?? "");
      setDate(res.date ?? todayISO());
      setTotal(res.total == null ? "" : String(res.total));
      if (res.currency) setCurrency(res.currency);
      const match = (categories.data ?? []).find(
        (c) => c.name.toLowerCase() === (res.category ?? "").toLowerCase(),
      );
      setCategoryId(match?.id ?? categories.data?.[0]?.id ?? null);
      setItems(
        (res.items ?? []).map((it) => ({
          name: it.name,
          quantity: String(it.quantity ?? 1),
          unit_price: it.unit_price == null ? "" : String(it.unit_price),
          line_total: it.line_total == null ? "" : String(it.line_total),
          need_want: it.need_want,
          reason: it.reason ?? "",
        })),
      );
      setScanned(true);
      toast.success("Receipt scanned — check the details");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const entered = Number(total);
      if (!entered || entered <= 0) throw new Error("Enter the receipt total");
      const path = file ? await api.uploadReceiptImage(file) : null;
      const receiptId = await api.createReceipt({
        image_path: path,
        merchant: merchant.trim() || null,
        receipt_date: date,
        total: entered,
        currency,
        category_id: categoryId,
      });
      await api.createReceiptItems(
        receiptId,
        items.map((it) => ({
          name: it.name.trim() || "Item",
          quantity: Number(it.quantity) || 1,
          unit_price: it.unit_price ? Number(it.unit_price) : null,
          line_total: it.line_total ? Number(it.line_total) : null,
          need_want: it.need_want,
          reason: it.reason || null,
        })),
      );

      let needTotal = 0;
      let wantTotal = 0;
      for (const it of items) {
        const v = Number(it.line_total) || Number(it.unit_price) * (Number(it.quantity) || 1) || 0;
        if (it.need_want === "need") needTotal += v;
        else wantTotal += v;
      }
      const overall: api.NeedWant =
        items.length === 0 ? null : needTotal >= wantTotal ? "need" : "want";

      await api.createExpense({
        amount: toBase(entered, currency, base, rates.data),
        original_amount: entered,
        currency,
        fx_rate: rateFor(currency, base, rates.data),
        category_id: categoryId,
        spent_on: date,
        note: merchant.trim() || "Receipt",
        need_want: overall,
        receipt_id: receiptId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      reset();
      onOpenChange(false);
      toast.success("Receipt saved as an expense");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function pick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    scan.mutate(f);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="glass max-h-[90vh] overflow-y-auto border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-[0.12em]">
            Scan receipt
          </DialogTitle>
        </DialogHeader>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {!scanned ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Take a photo of the receipt or pick one from your gallery — AI reads the items, prices
              and suggests a category.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-14 rounded-2xl"
                onClick={() => cameraRef.current?.click()}
                disabled={scan.isPending || !offline.online}
              >
                <Camera className="mr-1 h-5 w-5" /> Camera
              </Button>
              <Button
                variant="secondary"
                className="h-14 rounded-2xl"
                onClick={() => galleryRef.current?.click()}
                disabled={scan.isPending || !offline.online}
              >
                <ImagePlus className="mr-1 h-5 w-5" /> Gallery
              </Button>
            </div>
            {!offline.online && (
              <p className="text-sm text-muted-foreground">
                {OFFLINE_NEEDS_NET} — receipt scanning reads the photo online.
              </p>
            )}
            {scan.isPending && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading the receipt…
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                id="merchant"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="h-11 bg-input/40"
              />
            </div>

            <AmountField
              id="receipt-total"
              label="Total"
              amount={total}
              onAmountChange={setTotal}
              currency={currency}
              onCurrencyChange={setCurrency}
              base={base}
              rates={rates.data}
            />

            <div className="space-y-1.5">
              <Label htmlFor="receipt-date">Date</Label>
              <Input
                id="receipt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 bg-input/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {(categories.data ?? []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
                      categoryId === c.id
                        ? "bg-primary text-primary-foreground"
                        : "glass-soft text-muted-foreground",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items ({items.length})</Label>
              {items.map((it, i) => (
                <div key={i} className="rounded-2xl glass-soft p-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      value={it.name}
                      onChange={(e) => patchItem(setItems, i, { name: e.target.value })}
                      className="h-9 flex-1 bg-input/40 text-sm"
                      placeholder="Item"
                    />
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Mini
                      label="Qty"
                      value={it.quantity}
                      onChange={(v) => patchItem(setItems, i, { quantity: v })}
                    />
                    <Mini
                      label="Unit"
                      value={it.unit_price}
                      onChange={(v) => patchItem(setItems, i, { unit_price: v })}
                    />
                    <Mini
                      label="Total"
                      value={it.line_total}
                      onChange={(v) => patchItem(setItems, i, { line_total: v })}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {(["need", "want"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => patchItem(setItems, i, { need_want: v })}
                        className={cn(
                          "rounded-full border border-border px-2.5 py-1 text-[11px] capitalize",
                          it.need_want === v
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                    {it.reason && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {it.reason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    {
                      name: "",
                      quantity: "1",
                      unit_price: "",
                      line_total: "",
                      need_want: "need",
                      reason: "",
                    },
                  ])
                }
              >
                Add item
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {scanned ? (
            <Button
              className="h-12 w-full text-base"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              <ScanLine className="mr-1 h-5 w-5" /> Save as expense
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function patchItem(
  setItems: React.Dispatch<React.SetStateAction<DraftItem[]>>,
  index: number,
  patch: Partial<DraftItem>,
) {
  setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
}

function Mini({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <Input
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        className="h-9 bg-input/40 px-2 text-sm"
      />
    </label>
  );
}
