import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { DeviceSyncService } from '../../services/crypto/DeviceSyncService';
import { vault } from '../../services/crypto/LocalVault';
import { CryptoUtils } from '../../services/crypto/CryptoUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, QrCode, ShieldCheck, AlertCircle, X, ChevronRight } from 'lucide-react';

interface DeviceSyncProps {
    onClose: () => void;
}

export const DeviceSync: React.FC<DeviceSyncProps> = ({ onClose }) => {
    const [mode, setMode] = useState<'selection' | 'owner' | 'new'>('selection');
    const [qrData, setQrData] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Owner Logic
    const startAsOwner = async () => {
        try {
            setMode('owner');
            setStatus('Checking identity...');

            let identityPrivateKey = await vault.getSecret('identity_private_key');

            if (!identityPrivateKey) {
                setStatus('Generating new security identity...');
                const keys = await CryptoUtils.generateIdentityKeyPair();
                const pubKeyBase64 = await CryptoUtils.exportPublicKey(keys.publicKey);

                await vault.saveSecret('identity_private_key', keys.privateKey);

                if (auth.currentUser) {
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                        'publicKeys.identity': pubKeyBase64
                    });
                }
                setStatus('Identity created! Opening sync portal...');
            }

            const { sessionId, publicKey } = await DeviceSyncService.startSyncSession();
            setQrData(JSON.stringify({ s: sessionId, p: publicKey }));
            setStatus('Ready for scanning');

            DeviceSyncService.listenForSyncRequests(sessionId, () => {
                setStatus('Sync complete!');
                setTimeout(onClose, 2000);
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to establish primary device.');
        }
    };

    // New Device Logic
    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (mode === 'new') {
            const timeout = setTimeout(() => {
                const element = document.getElementById('reader');
                if (!element) return;

                scanner = new Html5QrcodeScanner("reader", {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    rememberLastUsedCamera: true,
                    aspectRatio: 1.0
                }, false);

                scanner.render(async (decodedText) => {
                    try {
                        if (scanner) scanner.clear();
                        setStatus('Requesting access...');
                        const { s, p } = JSON.parse(decodedText);
                        await DeviceSyncService.joinSyncSession(s, p);
                        setStatus('Identity verified! Restarting...');
                        setTimeout(() => window.location.reload(), 1500);
                    } catch (err: any) {
                        setError('Invalid QR code format or sync failed.');
                        setStatus('');
                    }
                }, (err) => { });
            }, 500); // Small delay to ensure DOM is ready

            return () => {
                clearTimeout(timeout);
                if (scanner) {
                    scanner.clear().catch(e => console.error("Scanner clear fail", e));
                }
            };
        }
    }, [mode]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
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
                            <ShieldCheck className="w-6 h-6 text-violet-500" />
                            Device Sync
                        </h2>
                        <p className="text-sm text-zinc-500">Secure E2EE Key Transfer</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {mode === 'selection' && (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <button
                                    onClick={startAsOwner}
                                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-violet-500 transition-all text-left flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Establish Primary Device</span>
                                        <span className="text-xs text-zinc-500">I have my identity keys on this device.</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                                </button>

                                <button
                                    onClick={() => setMode('new')}
                                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 transition-all text-left flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <Monitor className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Link New Device</span>
                                        <span className="text-xs text-zinc-500">I want to sync keys to this device.</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                                </button>
                            </motion.div>
                        )}

                        {mode === 'owner' && (
                            <motion.div
                                key="owner"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-6"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-lg">
                                    {qrData ? (
                                        <QRCodeSVG value={qrData} size={200} />
                                    ) : (
                                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">Scan this code from your new device</p>
                                    <p className="text-sm text-zinc-500 mt-1">{status}</p>
                                </div>
                            </motion.div>
                        )}

                        {mode === 'new' && (
                            <motion.div
                                key="new"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-6"
                            >
                                <div id="reader" className="w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"></div>
                                <div className="flex items-center gap-2 text-violet-500 font-medium">
                                    <QrCode className="w-5 h-5" />
                                    <span>{status || 'Waiting for scan...'}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 text-center">
                    <p className="text-xs text-zinc-400">
                        This process transfers your private identity key. <br />
                        Keep your screens private during sync.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
