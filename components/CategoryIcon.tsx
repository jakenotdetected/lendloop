import {
  Box,
  ChefHat,
  Sparkles,
  Sprout,
  Tent,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "power-tools": Zap,
  "hand-tools": Wrench,
  garden: Sprout,
  kitchen: ChefHat,
  camping: Tent,
  cleaning: Sparkles,
  other: Box,
};

export function CategoryIcon({
  category,
  size = 18,
}: {
  category: string;
  size?: number;
}) {
  const Icon = ICONS[category] ?? Box;
  return <Icon size={size} strokeWidth={2.2} aria-hidden />;
}
