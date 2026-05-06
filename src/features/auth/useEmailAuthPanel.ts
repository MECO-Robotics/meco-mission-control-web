import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import type { EmailCodeDeliveryResponse } from "@/lib/auth/types";

interface UseEmailAuthPanelArgs {
  clearAuthMessage: () => void;
  onRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  onVerifyEmailCode: (email: string, code: string) => Promise<void>;
}

export function useEmailAuthPanel({
  clearAuthMessage,
  onRequestEmailCode,
  onVerifyEmailCode,
}: UseEmailAuthPanelArgs) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [delivery, setDelivery] = useState<EmailCodeDeliveryResponse | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const handleEmailChange = (milestone: ChangeEvent<HTMLInputElement>) => {
    clearAuthMessage();
    setEmail(milestone.target.value);
    setCode("");
    setDelivery(null);
  };

  const handleCodeChange = (milestone: ChangeEvent<HTMLInputElement>) => {
    clearAuthMessage();
    setCode(milestone.target.value);
  };

  const handleRequestCode = async (milestone: FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsRequestingCode(true);

    try {
      const response = await onRequestEmailCode(email);
      setDelivery(response);
      setCode("");
      window.setTimeout(() => {
        codeInputRef.current?.focus();
      }, 0);
    } catch {
      // The hook already surfaced the error message.
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyCode = async (milestone: FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();

    try {
      await onVerifyEmailCode(email, code);
    } catch {
      // The hook already surfaced the error message.
    }
  };

  return {
    code,
    codeInputRef,
    delivery,
    email,
    handleCodeChange,
    handleEmailChange,
    handleRequestCode,
    handleVerifyCode,
    isRequestingCode,
  };
}
