import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Loader2 } from "lucide-react"

// Simple utils inside to avoid extra file
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const buttonVariants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:translate-y-[-1px] active:translate-y-0 shadow-indigo-100",
    secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
    destructive: "bg-red-50 text-red-600 hover:bg-red-100",
}

const buttonSizes = {
    default: "h-11 px-4 py-2",
    sm: "h-9 rounded-lg px-3 text-xs",
    lg: "h-14 rounded-xl px-8 text-lg font-semibold",
    icon: "h-10 w-10",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants
    size?: keyof typeof buttonSizes
    asChild?: boolean
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, isLoading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    buttonVariants[variant],
                    buttonSizes[size],
                    className
                )}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"
export { Button }
