import { createServerFn } from "@tanstack/react-start";

import { fetchRatesFromProvider } from "./fx.server";

export const getLiveRates = createServerFn({ method: "POST" })
  .inputValidator((input: { base: string; codes: string[] }) => input)
  .handler(async ({ data }) => fetchRatesFromProvider(data.base, data.codes));
