import React from 'react';

interface DecryptionErrorMessageProps {
    onRepair: () => void;
    isPersonal: boolean;
}

export const DecryptionErrorMessage: React.FC<DecryptionErrorMessageProps> = ({ onRepair, isPersonal }) => {
    return (
        <div className="flex flex-col items-center p-3 my-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm mb-2">
                <span className="text-lg">🔒</span>
                <span>Secure channel corrupted or key mismatch</span>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 max-w-xs">
                {isPersonal 
                    ? "This message was encrypted for a different security identity. Usually happens if a friend changed devices or cleared their cache."
                    : "Decryption failed within this group. Try repairing the channel."
                }
            </p>

            <button
                onClick={onRepair}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-md shadow-red-600/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                </svg>
                Repair Secure Channel
            </button>
        </div>
    );
};
