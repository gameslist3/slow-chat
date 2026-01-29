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
            <div className="w-full space-y-3 lead">
                {label && (
                    <label className="font-protocol text-[9px] tracking-[0.4em] uppercase text-primary opacity-50 ml-6">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        type={type}
                        className={cn(
                            "flex h-16 w-full rounded-2xl border border-white/5 bg-foreground/5 px-6 py-4 text-sm font-medium placeholder:text-muted-foreground/20 focus:outline-none focus:ring-0 focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm group-hover:border-primary/20 backdrop-blur-xl",
                            icon && "pl-14",
                            error && "border-destructive focus:border-destructive",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 transition-all group-focus-within:text-primary group-focus-within:opacity-100">
                            {icon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="font-protocol text-[10px] tracking-widest text-destructive animate-in fade-in slide-in-from-top-1 ml-6 uppercase">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"
export { Input }
