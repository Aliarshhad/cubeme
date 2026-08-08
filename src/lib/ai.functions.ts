import { createServerFn } from "@tanstack/react-start";

import { classifyExpense, scanReceiptImage } from "./ai.server";

export const scanReceipt = createServerFn({ method: "POST" })
  .inputValidator((input: { imageDataUrl: string; categories: string[] }) => input)
  .handler(async ({ data }) => scanReceiptImage(data.imageDataUrl, data.categories));

export const needOrWant = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { description: string; category: string; amount: number; currency: string }) => input,
  )
  .handler(async ({ data }) => classifyExpense(data));
