/** Server-only Lovable AI Gateway calls (receipt OCR + need/want classification). */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

type Content = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

async function callGateway(
  messages: { role: "system" | "user"; content: string | Content[] }[],
  schema: { name: string; schema: Record<string, unknown> },
) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      messages,
      response_format: { type: "json_schema", json_schema: { ...schema, strict: true } },
    }),
  });

  if (res.status === 429) throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits are exhausted. Add credits to continue.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");
  return JSON.parse(content) as unknown;
}

const nullableString = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };

export const RECEIPT_SCHEMA = {
  name: "receipt",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      merchant: nullableString,
      date: nullableString,
      currency: nullableString,
      total: nullableNumber,
      category: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            unit_price: nullableNumber,
            line_total: nullableNumber,
            need_want: { type: "string", enum: ["need", "want"] },
            reason: { type: "string" },
          },
          required: ["name", "quantity", "unit_price", "line_total", "need_want", "reason"],
        },
      },
    },
    required: ["merchant", "date", "currency", "total", "category", "items"],
  },
};

export type ScannedReceipt = {
  merchant: string | null;
  date: string | null;
  currency: string | null;
  total: number | null;
  category: string;
  items: {
    name: string;
    quantity: number;
    unit_price: number | null;
    line_total: number | null;
    need_want: "need" | "want";
    reason: string;
  }[];
};

export async function scanReceiptImage(imageDataUrl: string, categoryNames: string[]) {
  const result = await callGateway(
    [
      {
        role: "system",
        content:
          "You read photos of shop receipts and return structured data. Extract the merchant, the receipt date as YYYY-MM-DD, the currency as a 3-letter ISO code if visible, the grand total, and every line item with its quantity, unit price and line total. Pick the single best category from the provided list. For each item decide whether it is a 'need' (essential: staple food, transport, utilities, medicine, hygiene) or a 'want' (discretionary: treats, luxury, entertainment) and give a short reason of at most 12 words. If a value is not readable use null. Never invent items that are not on the receipt.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Available categories: ${categoryNames.join(", ")}. Read this receipt.`,
          },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    RECEIPT_SCHEMA,
  );
  return result as ScannedReceipt;
}

export const NEED_WANT_SCHEMA = {
  name: "need_want",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      label: { type: "string", enum: ["need", "want"] },
      reason: { type: "string" },
    },
    required: ["label", "reason"],
  },
};

export async function classifyExpense(input: {
  description: string;
  category: string;
  amount: number;
  currency: string;
}) {
  const result = await callGateway(
    [
      {
        role: "system",
        content:
          "You label a personal expense as a 'need' (essential to live and work: staple food, rent, utilities, transport to work, medicine, hygiene, education) or a 'want' (discretionary: dining out, treats, entertainment, upgrades, luxury). Reply with the label and a reason of at most 15 words.",
      },
      {
        role: "user",
        content: `Category: ${input.category}. Amount: ${input.amount} ${input.currency}. Details: ${input.description || "(none)"}`,
      },
    ],
    NEED_WANT_SCHEMA,
  );
  return result as { label: "need" | "want"; reason: string };
}
