import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthAlertProps {
  type: "error" | "success";
  message: string;
  className?: string;
}

export function AuthAlert({ type, message, className }: AuthAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        type === "error" &&
          "border-destructive/30 bg-destructive/5 text-destructive",
        type === "success" &&
          "border-success/30 bg-success/5 text-success",
        className
      )}
    >
      {type === "error" ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <p>{message}</p>
    </div>
  );
}
