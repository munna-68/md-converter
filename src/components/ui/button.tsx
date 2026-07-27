import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "outline" | "ghost"
type ButtonSize = "default" | "sm" | "lg" | "icon"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-accent text-paper hover:bg-accent-hover shadow-sm shadow-accent/10",
  outline:
    "border border-border bg-transparent hover:bg-paper-lighter hover:border-border-hover",
  ghost: "hover:bg-paper-lighter",
}

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-6 text-sm",
  icon: "h-9 w-9",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ring-offset-paper transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button }
export type { ButtonProps }
