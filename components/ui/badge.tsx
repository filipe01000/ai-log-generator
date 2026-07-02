import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "border-transparent bg-primary/20 text-primary",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      outline: "text-foreground",
      informational: "border-sky-400/30 bg-sky-400/10 text-sky-300",
      low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      medium: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
      high: "border-orange-400/30 bg-orange-400/10 text-orange-300",
      critical: "border-red-400/30 bg-red-400/10 text-red-300"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
