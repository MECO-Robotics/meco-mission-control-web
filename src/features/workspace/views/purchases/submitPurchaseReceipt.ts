interface SubmitPurchaseReceiptOptions {
  write: () => Promise<unknown>;
  refresh: () => Promise<unknown>;
  acknowledge: () => void;
  reportError: (error: unknown) => void;
}

export async function submitPurchaseReceipt({ write, refresh, acknowledge, reportError }: SubmitPurchaseReceiptOptions) {
  try {
    await write();
    acknowledge();
    await refresh();
  } catch (error) {
    reportError(error);
  }
}
