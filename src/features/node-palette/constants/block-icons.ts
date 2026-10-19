import {
  PanelTop,
  Rocket,
  LayoutGrid,
  BadgeDollarSign,
  MessageSquareQuote,
  LogIn,
  Hash,
  Megaphone,
  CircleHelp,
  PanelBottom,
  Blocks,
  type LucideIcon,
} from "lucide-react";

const BLOCK_ICONS: Record<string, LucideIcon> = {
  "block.navbar": PanelTop,
  "block.hero": Rocket,
  "block.features": LayoutGrid,
  "block.pricing": BadgeDollarSign,
  "block.testimonials": MessageSquareQuote,
  "block.stats": Hash,
  "block.cta": Megaphone,
  "block.faq": CircleHelp,
  "block.login": LogIn,
  "block.footer": PanelBottom,
};

export function getBlockIcon(id: string): LucideIcon {
  return BLOCK_ICONS[id] ?? Blocks;
}
