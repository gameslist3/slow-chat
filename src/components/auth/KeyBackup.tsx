import React, { useState } from 'react';
import { vault } from '../../services/crypto/LocalVault';
import { CryptoUtils } from '../../services/crypto/CryptoUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Download, Upload, Key, X, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

interface KeyBackupProps {
    onClose: () => void;
}

export const KeyBackup: React.FC<KeyBackupProps> = ({ onClose }) => {
    const [mode, setMode] = useState<'selection' | 'export' | 'import'>('selection');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const handleExport = async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        try {
            setStatus('Preparing recovery file...');
            setError(null);

            const privateKey = await vault.getSecret('identity_private_key');
            if (!privateKey) throw new Error('Recovery key not found on this device.');

            setStatus('Securing with password...');
            const exportedKey = await CryptoUtils.exportPrivateKey(privateKey);
            const backup = await CryptoUtils.encryptWithPassword(exportedKey, password);

            const backupData = {
                version: 1,
                timestamp: Date.now(),
                ...backup,
                type: 'slowchat_identity_v1'
            };

            const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SlowChat_Recovery_Key_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess(true);
            setStatus('Account key saved! Keep the file and password in a safe place.');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Saving failed.');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!password) {
            setError('Please enter your recovery password first.');
            return;
        }

        try {
            setStatus('Opening recovery file...');
            setError(null);
            const text = await file.text();
            const backup = JSON.parse(text);

            if (backup.type !== 'slowchat_identity_v1') {
                throw new Error('This is not a valid recovery file.');
            }

            setStatus('Unlocking account...');
            const decryptedKeyBase64 = await CryptoUtils.decryptWithPassword(
                backup.ciphertext,
                backup.iv,
                backup.salt,
                password
            );

            const privateKey = await CryptoUtils.importPrivateKey(decryptedKeyBase64);

            setStatus('Finalizing recovery...');
            await vault.saveSecret('identity_private_key', privateKey);

            setSuccess(true);
            setStatus('Account recovered! Restarting...');
            setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
            console.error(err);
            setError('Could not unlock. Wrong password or broken file.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Lock className="w-6 h-6 text-emerald-500" />
                            Identity Recovery
                        </h2>
                        <p className="text-sm text-zinc-500 text-left">Keep your account safe and recover it anytime.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {mode === 'selection' && !success && (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <button
                                    onClick={() => setMode('export')}
                                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-emerald-500 transition-all text-left flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Save Account Key</span>
                                        <span className="text-xs text-zinc-500 text-left block">Download a backup file to recover your messages later.</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setMode('import')}
                                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 transition-all text-left flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Recover Account</span>
                                        <span className="text-xs text-zinc-500 text-left block">Import your backup file to regain access.</span>
                                    </div>
                                </button>
                            </motion.div>
                        )}

                        {(mode === 'export' || mode === 'import') && !success && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                        Recovery Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full px-5 py-4 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 dark:text-zinc-100 outline-none"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 ml-1 leading-relaxed">
                                        {mode === 'export'
                                            ? "Save this password! You will need it to unlock your account file later."
                                            : "Enter the password you chose when saving your account key."
                                        }
                                    </p>
                                </div>

                                {mode === 'export' ? (
                                    <button
                                        onClick={handleExport}
                                        disabled={password.length < 8}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                                    >
                                        Download Account Key
                                    </button>
                                ) : (
                                    <label className="block w-full">
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImport}
                                            className="hidden"
                                            disabled={!password}
                                        />
                                        <div className={`
                                            w-full py-4 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all
                                            ${!password ? 'opacity-50 border-zinc-300 pointer-events-none' : 'border-blue-500/50 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'}
                                        `}>
                                            <span className="text-blue-600 dark:text-blue-400 font-bold">Select Backup File</span>
                                        </div>
                                    </label>
                                )}

                                <button
                                    onClick={() => setMode('selection')}
                                    className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
                                >
                                    Back
                                </button>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-4 py-4"
                            >
                                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 animate-bounce">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Success!</h3>
                                <p className="text-sm text-zinc-500 px-4">{status}</p>
                                {mode === 'export' && (
                                    <button
                                        onClick={onClose}
                                        className="mt-4 px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold"
                                    >
                                        Done
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-left font-medium">{error}</p>
                        </motion.div>
                    )}

                    {status && !success && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {status}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 text-center border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-wider font-bold">
                        🔐 Protected Security Identity
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
