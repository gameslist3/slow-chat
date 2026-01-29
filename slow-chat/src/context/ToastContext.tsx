import React, { createContext, useContext, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = (message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-0 left-0 md:left-auto md:right-4 z-50 flex flex-col items-center md:items-end gap-2 px-4 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
              pointer-events-auto flex items-center p-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] max-w-sm
              ${t.type === 'success' ? 'bg-white border-green-100 text-green-800' : ''}
              ${t.type === 'error' ? 'bg-white border-red-100 text-red-800' : ''}
              ${t.type === 'info' ? 'bg-white border-gray-100 text-gray-800' : ''}
            `}
                    >
                        {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />}
                        {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />}
                        {t.type === 'info' && <Info className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />}
                        <p className="text-sm font-medium flex-1">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};
