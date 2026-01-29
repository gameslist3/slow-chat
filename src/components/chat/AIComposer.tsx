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
            recorder.start(200); // 200ms slices for reliability
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

            // Clear reply state after successful media upload
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

        // Clear reply state after successful text send
        if (replyingTo) onCancelReply?.();
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-3 p-4">
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="mx-auto w-full max-w-4xl px-2"
                    >
                        <div className="glass-panel rounded-[1.5rem] p-3 flex justify-between items-center text-xs shadow-xl">
                            <div className="flex flex-col gap-0.5 border-l-3 border-primary pl-4">
                                <span className="font-black text-primary uppercase tracking-tight italic">Replying to {replyingTo.sender}</span>
                                <span className="text-muted-foreground truncate max-w-md opacity-70">{replyingTo.text || `[${replyingTo.type}]`}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCancelReply}
                                className="p-2 rounded-full"
                            >
                                <Icon name="x" className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                layout
                className={`glass-panel max-w-4xl mx-auto w-full p-2 transition-all duration-500 shadow-2xl ${cooldown > 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
            >
                {isRecording ? (
                    <div className="flex items-center justify-between w-full px-4 h-[56px] animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-3 h-3 rounded-full bg-destructive shadow-lg shadow-destructive/20"
                            />
                            <span className="font-mono font-black text-lg tracking-widest text-destructive">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={cancelRecording}
                                className="p-3 text-destructive rounded-xl transition-all"
                            >
                                <Icon name="x" className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={stopRecording}
                                className="bg-destructive text-white p-4 rounded-full shadow-2xl shadow-destructive/40"
                            >
                                <Icon name="stop" className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <>
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
                            placeholder={cooldown > 0 ? `LOCKED (${cooldown}s)` : "Premium AI Experience..."}
                            disabled={cooldown > 0}
                            className="w-full bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 px-5 py-4 resize-none text-[16px] max-h-[240px] placeholder:text-muted-foreground/30 font-bold tracking-tight"
                        />
                        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-border/5">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*,video/*,application/pdf,.doc,.docx"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(91, 125, 203, 0.1)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-11 h-11 rounded-2xl text-muted-foreground hover:text-primary transition-all flex items-center justify-center"
                                >
                                    <Icon name="paperclip" className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(91, 125, 203, 0.1)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={startRecording}
                                    className={`w-11 h-11 rounded-2xl text-muted-foreground hover:text-primary transition-all flex items-center justify-center ${uploading ? 'animate-pulse' : ''}`}
                                >
                                    <Icon name="mic" className="w-5 h-5" />
                                </motion.button>
                            </div>

                            <div className="flex items-center gap-3">
                                <ScaleAnimate show={cooldown > 0}>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-2xl text-[10px] font-black uppercase tracking-widest border border-destructive/10">
                                        <Icon name="zap" className="w-3 h-3 fill-destructive" />
                                        <span>{cooldown}s</span>
                                    </div>
                                </ScaleAnimate>

                                <motion.button
                                    whileHover={text.trim() ? { scale: 1.1, x: 2 } : {}}
                                    whileTap={text.trim() ? { scale: 0.9 } : {}}
                                    onClick={handleSendText}
                                    disabled={cooldown > 0 || !text.trim()}
                                    className={`
                                        rounded-[1.25rem] h-12 w-12 flex items-center justify-center transition-all shadow-xl overflow-hidden
                                        ${text.trim() ? 'bg-primary text-white shadow-primary/30' : 'bg-foreground/5 text-muted-foreground/30'}
                                    `}
                                >
                                    {text.trim() && sendAnimation ? (
                                        <div className="w-10 h-10 scale-150">
                                            <Lottie animationData={sendAnimation} loop={true} />
                                        </div>
                                    ) : <Icon name="send" className="w-6 h-6" />}
                                </motion.button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

const ScaleAnimate: React.FC<{ show: boolean, children: React.ReactNode }> = ({ show, children }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
);

