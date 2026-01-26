import React from 'react';
import { Button } from '../ui/Button';
import { HardDrive, ShieldCheck } from 'lucide-react';

export const StoragePolicyModal = ({ onAccept }: { onAccept: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 mx-auto text-indigo-600">
                    <HardDrive className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Your Data, Your Device</h2>

                <div className="space-y-4 text-gray-600 mb-8 text-sm leading-relaxed">
                    <p>
                        SlowChat is designed with a <span className="font-bold text-gray-900">Local-First</span> architecture.
                        This means we do not store your messages or groups on a central cloud database.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl flex gap-3 items-start">
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <p>All your chats, groups, and settings are saved directly on this device.</p>
                    </div>
                    <p>
                        If you clear your browser data or switch devices without exporting, your chat history will not be available.
                    </p>
                </div>

                <Button onClick={onAccept} size="lg" className="w-full">
                    I Understand, Continue
                </Button>
            </div>
        </div>
    );
};
