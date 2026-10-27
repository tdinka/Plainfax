// Every fax line (simulated or Telnyx) looks the same to the rest of the app.

export type SendRequest = {
  to: string; // E.164
  mediaUrl: string; // public link the line downloads the PDF from
};

export interface FaxProvider {
  name: "mock" | "telnyx";
  /** Starts a send and returns the provider's id for this attempt. */
  send(req: SendRequest): Promise<{ providerFaxId: string }>;
}

/** Failure reasons worth one automatic retry (busy line, no answer...). */
export const RETRYABLE_REASONS = new Set([
  "user_busy",
  "receiver_no_answer",
  "receiver_busy",
  "no_answer",
  "timeout",
  "receiver_call_dropped",
  "sender_call_dropped",
  "fax_signaling_error",
  "receiver_communication_error",
  "send_error",
]);

/** Plain-English versions of the reasons people are most likely to see. */
export function describeFailure(reason: string | null | undefined): string {
  switch (reason) {
    case "user_busy":
    case "receiver_busy":
      return "The fax line was busy every time we tried.";
    case "receiver_no_answer":
    case "no_answer":
      return "Nobody's fax machine picked up.";
    case "destination_invalid":
    case "destination_unreachable":
    case "invalid_number":
      return "That number couldn't be reached. Check that it's a fax number, not a phone line.";
    case "receiver_incompatible_destination":
    case "receiver_invalid_number_format":
      return "The number answered, but it isn't a fax machine.";
    case "send_error":
      return "Our fax line had a problem sending.";
    default:
      return "The receiving fax machine didn't accept the fax.";
  }
}
