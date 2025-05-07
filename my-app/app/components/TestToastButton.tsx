"use client";
import { toast } from "sonner";

export function ToastTestButton() {
  return (
    <button
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}
      onClick={() =>
        toast.info("Test Toast! If you see this, toasts are working.")
      }
    >
      Test Toast
    </button>
  );
}
