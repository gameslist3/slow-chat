import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, StopCircle, Play, Pause, FileText, ImageIcon, Video, Zap } from 'lucide-react';
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
        <div className="ui-composer flex flex-col gap-2">
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mx-auto w-full max-w-4xl px-4 md:px-6"
                    >
                        <div className="bg-surface2 border border-border rounded-t-2xl p-3 flex justify-between items-center text-xs">
                            <div className="flex flex-col gap-0.5 border-l-2 border-primary pl-3">
                                <span className="font-bold text-primary italic">Replying to {replyingTo.sender}</span>
                                <span className="text-muted-foreground truncate max-w-md">{replyingTo.text || `[${replyingTo.type}]`}</span>
                            </div>
                            <button onClick={onCancelReply} className="ui-button-ghost p-1 rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`ui-composer-inner max-w-4xl mx-auto w-full p-2 transition-all duration-300 ${cooldown > 0 ? 'opacity-50 border-danger/20' : ''}`}>
                {isRecording ? (
                    <div className="flex items-center justify-between w-full px-4 h-[52px] animate-in fade-in slide-in-from-left-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                            <span className="font-mono font-bold text-sm tracking-widest">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={cancelRecording} className="ui-button-ghost p-2 text-danger hover:bg-danger/5 rounded-xl transition-all" title="Cancel"><X className="w-5 h-5" /></button>
                            <button onClick={stopRecording} className="bg-danger text-white p-3 rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-danger/20 transition-all" title="Finish Recording"><StopCircle className="w-5 h-5" /></button>
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
                            placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "Type a message..."}
                            disabled={cooldown > 0}
                            className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 resize-none text-[15px] max-h-[200px] placeholder:text-muted-foreground/30 font-medium"
                        />
                        <div className="flex items-center justify-between px-2 pb-1">
                            <div className="flex items-center gap-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*,video/*,application/pdf,.doc,.docx"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="ui-button-ghost w-10 h-10 rounded-xl text-muted-foreground hover:text-primary transition-all"
                                    title="Attach"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={startRecording}
                                    className={`ui-button-ghost w-10 h-10 rounded-xl text-muted-foreground hover:text-primary transition-all ${uploading ? 'animate-pulse opacity-50 pointer-events-none' : ''}`}
                                    title="Voice Message"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {cooldown > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 text-danger rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border border-danger/20">
                                        <Zap className="w-3 h-3 fill-danger" />
                                        <span>{cooldown}s Cooldown</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleSendText}
                                    disabled={cooldown > 0 || !text.trim()}
                                    className={`
                                        rounded-2xl h-11 w-11 flex items-center justify-center transition-all shadow-xl overflow-hidden
                                        ${text.trim() ? 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20' : 'bg-surface2 text-muted-foreground/40'}
                                    `}
                                    title="Send"
                                >
                                    {text.trim() && sendAnimation ? (
                                        <div className="w-8 h-8 scale-150">
                                            <Lottie animationData={sendAnimation} loop={true} />
                                        </div>
                                    ) : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="mt-1 text-center opacity-20 hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">End-to-end encrypted</span>
            </div>
        </div>
    );
};
