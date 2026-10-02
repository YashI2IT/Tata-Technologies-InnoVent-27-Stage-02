import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

export interface ButtonProps extends HTMLMotionProps<"button"> {
 variant?: "default" | "outline" | "ghost" | "secondary" | "danger";
 size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant = "default", size = "default", ...props }, ref) => {
 return (
 <motion.button
 ref={ref}
 whileTap={{ scale: size === "icon" ? 0.97 : 0.98 }}
 className={cn(
 "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 disabled:pointer-events-none disabled:opacity-50",
 {
 "bg-brand text-white hover:bg-brand-hover": variant === "default",
 "border border-border-strong bg-surface hover:bg-surface-secondary hover:border-[#B9C7D6] text-text-primary": variant === "outline",
 "hover:bg-surface-secondary text-brand": variant === "ghost",
 "bg-surface text-text-primary border border-border-subtle hover:bg-surface-secondary hover:border-[#B9C7D6]": variant === "secondary",
 "bg-danger text-white hover:bg-danger/90": variant === "danger",
 "h-10 px-4 py-2": size === "default",
 "h-9 rounded-full px-3": size === "sm",
 "h-11 rounded-full px-8": size === "lg",
 "h-10 w-10": size === "icon",
 },
 className
 )}
 {...props}
 />
 )
 }
)
Button.displayName = "Button"

export { Button }
