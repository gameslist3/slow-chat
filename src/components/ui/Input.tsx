import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, label, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-bold text-gray-500 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        type={type}
                        className={cn(
                            "flex h-14 w-full rounded-2xl border border-border/50 bg-background/50 px-5 py-3 text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm backdrop-blur-sm",
                            icon && "pl-12",
                            error && "border-red-500 focus:border-red-500",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary">
                            {icon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"
export { Input }
