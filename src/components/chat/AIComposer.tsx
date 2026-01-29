import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadMedia, uploadVoice } from '../../services/cloudinaryService';
import { Message, ReplyMetadata, FileMetadata } from '../../types';

interface AIComposerProps {
    onSend: (content: { text?: string, media?: FileMetadata, type: Message['type'] }) => void;
    replyingTo?: Message | null;
    onCancelReply?: () => void;
    cooldown?: number;
    groupId: string;
    userId: string;
}

export const AIComposer: React.FC<AIComposerProps> = ({
    onSend,
    replyingTo,
    onCancelReply,
    cooldown = 0,
    groupId,
    userId
}) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendAnimation, setSendAnimation] = useState<any>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<any>(null);
    const audioChunks = useRef<Blob[]>([]);

    useEffect(() => {
        const loadLottie = async () => {
            try {
                const res = await fetch('https://lottie.host/8c06385a-0f8f-4318-80f0-c5a4d048d0a0/oWw7n0oJ4O.json');
                const data = await res.json();
                setSendAnimation(data);
            } catch (err) {
                console.error('Lottie load error', err);
            }
        };
        loadLottie();
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [text]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isRecording) cancelRecording();
                else if (replyingTo) onCancelReply?.();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isRecording, replyingTo, onCancelReply]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (audioChunks.current.length === 0) return;
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                await handleUpload(audioBlob, 'audio');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current = recorder;
            recorder.start(200);
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime((prev: number) => prev + 1), 1000);
        } catch (err) {
            console.error('Mic access denied', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.onstop = null;
            mediaRecorder.current.stop();
            audioChunks.current = [];
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let type: Message['type'] = 'doc';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type === 'application/pdf') type = 'pdf';

        await handleUpload(file, type);
    };

    const handleUpload = async (file: File | Blob, type: Message['type']) => {
        setUploading(true);
        try {
            const url = type === 'audio'
                ? await uploadVoice(file as Blob, groupId, userId, setUploadProgress)
                : await uploadMedia(file as File, groupId, userId, setUploadProgress);

            onSend({
                media: {
                    url,
                    type,
                    name: (file as File).name || `audio_${Date.now()}.webm`,
                    size: file.size
                },
                type
            });

            if (replyingTo) onCancelReply?.();
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleSendText = () => {
        if (!text.trim() || cooldown > 0) return;
        onSend({ text: text.trim(), type: 'text' });
        setText('');
        if (replyingTo) onCancelReply?.();
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-4 p-8 pt-0 w-full max-w-6xl mx-auto">
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="px-6"
                    >
                        <div className="glass-panel rounded-3xl p-4 flex justify-between items-center bg-primary/5 border-primary/10 shadow-2xl">
                            <div className="flex flex-col gap-1 border-l-4 border-primary pl-5">
                                <span className="text-[9px] font-bold tracking-widest text-primary uppercase">Replying to: {replyingTo.sender}</span>
                                <span className="text-muted-foreground truncate max-w-lg opacity-60 text-sm font-medium">{replyingTo.text || `[${replyingTo.type}]`}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCancelReply}
                                className="p-3 rounded-2xl"
                            >
                                <Icon name="x" className="w-5 h-5 opacity-40" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                layout
                className={`glass-panel rounded-[2.5rem] p-3 transition-all duration-700 shadow-2xl ${cooldown > 0 ? 'opacity-40 grayscale pointer-events-none' : ''} border-white/5`}
            >
                {isRecording ? (
                    <div className="flex items-center justify-between w-full px-8 h-[72px]">
                        <div className="flex items-center gap-6">
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-4 h-4 rounded-full bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold tracking-widest text-destructive uppercase">Recording</span>
                                <span className="text-2xl font-bold tracking-[0.1em] text-foreground leading-none mt-1">{formatTime(recordingTime)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(239,68,68,0.05)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={cancelRecording}
                                className="p-4 text-destructive/60 rounded-2xl transition-all"
                            >
                                <Icon name="x" className="w-6 h-6" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={stopRecording}
                                className="bg-destructive text-white p-5 rounded-[1.5rem] shadow-2xl shadow-destructive/40"
                            >
                                <Icon name="stop" className="w-6 h-6" />
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendText();
                                }
                            }}
                            placeholder={cooldown > 0 ? `Slow mode enabled (${cooldown}s)` : "Type a message..."}
                            disabled={cooldown > 0}
                            className="w-full bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 px-8 py-6 resize-none text-[17px] max-h-[300px] placeholder:text-muted-foreground/20 font-medium leading-relaxed"
                        />

                        <div className="flex items-center justify-between px-5 pb-3 pt-3 border-t border-white/5 mt-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*,video/*,application/pdf,.doc,.docx"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-12 h-12 rounded-2xl text-muted-foreground hover:text-primary transition-all flex items-center justify-center border border-transparent hover:border-primary/10"
                                >
                                    <Icon name="paperclip" className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={startRecording}
                                    className={`w-12 h-12 rounded-2xl text-muted-foreground hover:text-primary transition-all flex items-center justify-center border border-transparent hover:border-primary/10 ${uploading ? 'animate-pulse' : ''}`}
                                >
                                    <Icon name="mic" className="w-5 h-5" />
                                </motion.button>
                            </div>

                            <div className="flex items-center gap-4">
                                <AnimatePresence>
                                    {cooldown > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex items-center gap-3 px-5 py-2.5 bg-destructive/10 text-destructive rounded-2xl border border-destructive/10"
                                        >
                                            <span className="text-[9px] font-bold tracking-widest">{cooldown}s cooldown</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    whileHover={text.trim() ? { scale: 1.1, y: -2 } : {}}
                                    whileTap={text.trim() ? { scale: 0.9 } : {}}
                                    onClick={handleSendText}
                                    disabled={cooldown > 0 || !text.trim()}
                                    className={`
                                        rounded-[1.75rem] h-14 min-w-[56px] px-5 flex items-center justify-center transition-all shadow-2xl overflow-hidden font-protocol text-[10px] tracking-[0.2em]
                                        ${text.trim() ? 'bg-primary text-white shadow-primary/40' : 'bg-foreground/5 text-muted-foreground opacity-20'}
                                    `}
                                >
                                    {text.trim() && sendAnimation ? (
                                        <div className="w-10 h-10 scale-[1.8] pointer-events-none">
                                            <Lottie animationData={sendAnimation} loop={true} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Icon name="send" className="w-5 h-5 mr-1" />
                                            <span className="hidden sm:inline">SEND</span>
                                        </div>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
