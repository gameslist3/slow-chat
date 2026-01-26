import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, User, Shield, HelpCircle, Save, CheckCircle, RefreshCw, Key, Shuffle, Mail, Phone } from 'lucide-react';
import { generateAnonymousName } from '../../services/firebaseAuthService';

export const AccountSettings = ({ onBack }: { onBack: () => void }) => {
    const { user, updateUsername, resetPassword } = useAuth();
    const { toast } = useToast();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [lockDate, setLockDate] = useState<Date | null>(null);

    // Calculate lock state on mount or user update
    useEffect(() => {
        if (user?.lastUsernameChange) {
            const next = new Date(user.lastUsernameChange + (7 * 24 * 60 * 60 * 1000));
            if (next > new Date()) {
                setLockDate(next);
            } else {
                setLockDate(null);
            }
        }
    }, [user]);

    const startEditing = () => {
        if (lockDate) return;
        setTempName(generateAnonymousName());
        setIsEditing(true);
    };

    const handleShuffle = () => {
        setTempName(generateAnonymousName());
    };

    const handleSaveName = async () => {
        if (!tempName) return;
        if (tempName === user?.username) { setIsEditing(false); return; }

        const success = await updateUsername(tempName);
        if (success) {
            toast("Identity updated.", "success");
            setIsEditing(false);
        } else {
            // Fallback if context logic prevented it
            const nextDate = new Date((user?.lastUsernameChange || 0) + (7 * 24 * 60 * 60 * 1000));
            toast(`Locked until ${nextDate.toLocaleDateString()}`, "error");
        }
    };

    const handlePasswordReset = () => {
        resetPassword();
        toast("Password reset link sent to your email.", "success");
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Minimal Header */}
            <div className="p-6 pb-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-800" /></Button>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-20 py-8">
                <div className="max-w-xl mx-auto space-y-12">

                    {/* Identity Section */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 delay-100">
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Identity</h2>

                            {!isEditing ? (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                                            {user?.username[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
                                            <p className="text-gray-500">{user?.email}</p>
                                        </div>
                                    </div>
                                    {lockDate ? (
                                        <Button disabled variant="outline" className="rounded-full border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-75">
                                            Change Name <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[10px] rounded-sm font-bold">Available {lockDate.toLocaleDateString()}</span>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" onClick={startEditing} className="rounded-full border-gray-200 hover:border-gray-900 hover:bg-transparent transition-all">
                                            Change Name
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-3xl p-8 space-y-8 animate-in zoom-in-95">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900 text-lg">Change Name</h3>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><ArrowLeft className="w-4 h-4" /></Button>
                                    </div>

                                    <div className="text-center py-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">NEW ALIAS</p>
                                        <p className="text-3xl font-black text-indigo-600 animate-in fade-in slide-in-from-bottom-2 key={tempName}">{tempName}</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={handleShuffle} className="flex-1 bg-white border-gray-200 h-12 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all">
                                            <Shuffle className="w-4 h-4 mr-2" /> Shuffle
                                        </Button>
                                        <Button onClick={handleSaveName} className="flex-1 bg-indigo-600 h-12 rounded-xl text-white shadow-lg shadow-indigo-200">
                                            Confirm
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-gray-400 max-w-xs mx-auto">This change will be locked for 7 days once confirmed.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Security Section */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 delay-200">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Security</h2>

                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-full text-gray-600"><Key className="w-5 h-5" /></div>
                                <div>
                                    <p className="font-bold text-gray-900">Password</p>
                                    <p className="text-sm text-gray-500">Secure your account</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium" onClick={handlePasswordReset}>
                                Reset
                            </Button>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Support Section */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 delay-300">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Support</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <a href="mailto:support@slowchat.com" className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-3xl transition-colors group cursor-pointer border border-transparent hover:border-indigo-100">
                                <div className="p-3 bg-white rounded-full text-gray-600 group-hover:text-indigo-600 shadow-sm"><Mail className="w-6 h-6" /></div>
                                <span className="font-bold text-sm">Email Support</span>
                            </a>
                            <a href="tel:+18005550123" className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-3xl transition-colors group cursor-pointer border border-transparent hover:border-indigo-100">
                                <div className="p-3 bg-white rounded-full text-gray-600 group-hover:text-indigo-600 shadow-sm"><Phone className="w-6 h-6" /></div>
                                <span className="font-bold text-sm">Call Support</span>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
