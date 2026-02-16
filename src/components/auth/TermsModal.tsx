import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0B1220]/90 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <h2 className="text-2xl font-black text-white tracking-tight">Terms of Service</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/50 hover:text-white"
                            >
                                <Icon name="x" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 text-blue-200/70 leading-relaxed text-sm">
                            <p>
                                <strong className="text-white block mb-2">1. Acceptance of Terms</strong>
                                By accessing and using Gapes, you acknowledge that you have read, understood, and agree to be bound by complying with all applicable laws and regulations.
                            </p>
                            <p>
                                <strong className="text-white block mb-2">2. Privacy & Data</strong>
                                We value your privacy. Your data is encrypted and stored securely. We do not sell your personal information to third parties.
                            </p>
                            <p>
                                <strong className="text-white block mb-2">3. User Conduct</strong>
                                You agree to use the service only for lawful purposes. Harassment, hate speech, and illegal activities are strictly prohibited.
                            </p>
                            <p>
                                <strong className="text-white block mb-2">4. Disclaimer</strong>
                                The service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                I Understand
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
