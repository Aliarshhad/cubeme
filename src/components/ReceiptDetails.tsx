import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { useCurrency, useReceipt, useReceiptItems, useSignedUrl } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Collapsible "more details" panel for a saved receipt: photo + editable line items. */
export function ReceiptDetails({ receiptId }: { receiptId: string }) {
  const [open, setOpen] = useState(false);
  const receipt = useReceipt(receiptId);
  const items = useReceiptItems(open ? receiptId : null);
  const image = useSignedUrl("receipts", open ? receipt.data?.image_path : null);
  const currency = useCurrency();
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<api.ReceiptItemInput> }) =>
      api.updateReceiptItem(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["receipt-items", receiptId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl glass-soft p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        More details {receipt.data?.merchant ? `· ${receipt.data.merchant}` : ""}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {image.data && (
            <img
              src={image.data}
              alt="Scanned receipt"
              className="max-h-56 w-full rounded-xl object-contain"
              loading="lazy"
            />
          )}
          {(items.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No line items stored.</p>
          ) : (
            <ul className="space-y-2">
              {(items.data ?? []).map((it) => (
                <li key={it.id} className="rounded-xl bg-input/30 p-2">
                  <Input
                    defaultValue={it.name}
                    onBlur={(e) =>
                      e.target.value !== it.name &&
                      update.mutate({ id: it.id, patch: { name: e.target.value } })
                    }
                    className="h-8 border-0 bg-transparent px-1 text-sm font-semibold"
                  />
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <LabeledMini
                      label="Qty"
                      defaultValue={String(it.quantity)}
                      onCommit={(v) => update.mutate({ id: it.id, patch: { quantity: Number(v) } })}
                    />
                    <LabeledMini
                      label="Unit"
                      defaultValue={it.unit_price == null ? "" : String(it.unit_price)}
                      onCommit={(v) =>
                        update.mutate({ id: it.id, patch: { unit_price: v ? Number(v) : null } })
                      }
                    />
                    <LabeledMini
                      label="Total"
                      defaultValue={it.line_total == null ? "" : String(it.line_total)}
                      onCommit={(v) =>
                        update.mutate({ id: it.id, patch: { line_total: v ? Number(v) : null } })
                      }
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {(["need", "want"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => update.mutate({ id: it.id, patch: { need_want: v } })}
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
                </li>
              ))}
            </ul>
          )}
          {receipt.data?.total != null && (
            <p className="text-right text-sm font-semibold">
              Receipt total {formatMoney(receipt.data.total, receipt.data.currency ?? currency)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LabeledMini({
  label,
  defaultValue,
  onCommit,
}: {
  label: string;
  defaultValue: string;
  onCommit: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <Input
        defaultValue={defaultValue}
        inputMode="decimal"
        onBlur={(e) => e.target.value !== defaultValue && onCommit(e.target.value)}
        className="h-8 bg-input/40 px-2 text-sm"
      />
    </label>
  );
}
