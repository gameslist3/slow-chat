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
            <div className="w-full space-y-1.5 lead">
                {label && (
                    <label className="text-sm font-medium leading-none text-gray-900 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        type={type}
                        className={cn(
                            "flex h-12 w-full rounded-2xl border border-border/50 bg-surface2 px-4 py-2 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 focus:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm group-hover:border-primary/20",
                            icon && "pl-11",
                            error && "border-danger focus:border-danger",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500">
                            {icon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"
export { Input }
