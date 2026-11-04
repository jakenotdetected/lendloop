import { Battery, BatteryFull, BatteryLow, BatteryMedium, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  new: BatteryFull,
  good: BatteryMedium,
  fair: BatteryLow,
  worn: Battery,
};

export function ConditionIcon({ condition, size = 18 }: { condition: string; size?: number }) {
  const Icon = ICONS[condition] ?? BatteryMedium;
  return <Icon size={size} strokeWidth={2.2} aria-hidden />;
}
