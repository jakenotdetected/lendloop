import { BadgeCheck } from "lucide-react";

export function TrustedBadge() {
  return (
    <span className="badge badge-trusted badge-small">
      <BadgeCheck size={14} strokeWidth={2.4} aria-hidden />
      Trusted
    </span>
  );
}
