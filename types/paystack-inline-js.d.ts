declare module "@paystack/inline-js" {
  interface PaystackTransactionResponse {
    reference: string;
    message?: string;
  }

  interface PaystackErrorResponse {
    message: string;
  }

  interface PaystackTransactionOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    onSuccess?: (transaction: PaystackTransactionResponse) => void;
    onCancel?: () => void;
    onError?: (error: PaystackErrorResponse) => void;
    onLoad?: (transaction: { id: number; accessCode: string }) => void;
  }

  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): unknown;
  }
}
