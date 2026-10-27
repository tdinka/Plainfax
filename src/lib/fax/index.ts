import { faxProviderName } from "../config";
import { mockProvider } from "./mock";
import { telnyxProvider } from "./telnyx";
import type { FaxProvider } from "./types";

export function getProvider(): FaxProvider {
  return faxProviderName() === "telnyx" ? telnyxProvider : mockProvider;
}
