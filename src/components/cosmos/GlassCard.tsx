import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  children: ReactNode;
}

export function GlassCard({ glow, className, children, ...rest }: GlassCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5",
        glow && "shadow-glow",
        className,
      )}
    >
      {children}
    </div>
  );
}