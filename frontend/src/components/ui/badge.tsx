import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
 return (
 <div
 className={cn(
 "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
 {
 "border-transparent bg-brand text-white hover:bg-brand/80": variant === "default",
 "border-transparent bg-surface-secondary text-text-primary hover:bg-surface-secondary/80": variant === "secondary",
 "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]": variant === "destructive",
 "border-border-strong text-text-primary": variant === "outline",
 "border-[#BBF7D0] bg-[#ECFDF5] text-[#15803D]": variant === "success",
 "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]": variant === "warning",
 "border-[#A5F3FC] bg-[#ECFEFF] text-[#0F766E]": variant === "info",
 },
 className
 )}
 {...props}
 />
 )
}

export { Badge }
