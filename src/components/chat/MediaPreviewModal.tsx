import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, File as FileIcon, Maximize2, ExternalLink } from 'lucide-react';
import { FileMetadata } from '../../types';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    media: FileMetadata;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ isOpen, onClose, media }) => {
    if (!media) return null;

    const isImage = media.type === 'image';
    const isVideo = media.type === 'video';
    const isAudio = media.type === 'audio';

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = media.url;
        link.download = media.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-5xl w-full bg-[#0F172A] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    {isImage ? <Maximize2 size={18} /> : <FileIcon size={18} />}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-bold text-white truncate">{media.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        {(media.size / 1024 / 1024).toFixed(2)} MB • {media.type}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="p-2.5 rounded-full bg-primary text-white hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2 px-4 group"
                                >
                                    <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">Download</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-[300px]">
                            {isImage && (
                                <img
                                    src={media.url}
                                    alt={media.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                                />
                            )}
                            {isVideo && (
                                <video
                                    src={media.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
                                />
                            )}
                            {isAudio && (
                                <div className="w-full max-w-md p-10 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                                        <FileIcon size={40} />
                                    </div>
                                    <audio src={media.url} controls className="w-full" />
                                </div>
                            )}
                            {!isImage && !isVideo && !isAudio && (
                                <div className="flex flex-col items-center gap-6 p-20 text-center">
                                    <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                                        <FileIcon size={48} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-2">No Preview Available</h2>
                                        <p className="text-sm text-gray-400 max-w-xs">
                                            This file type cannot be previewed directly. Please download it to view the content.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        className="px-8 py-3 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                    >
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer/Meta */}
                        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-center gap-8">
                           <a 
                             href={media.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-[10px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                           >
                             <ExternalLink size={12} /> Open in New Tab
                           </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
