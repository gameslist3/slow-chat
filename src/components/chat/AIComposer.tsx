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

type RecordingState = 'idle' | 'recording' | 'review';

export const AIComposer: React.FC<AIComposerProps> = ({
    onSend,
    replyingTo,
    onCancelReply,
    cooldown = 0,
    groupId,
    userId
}) => {
    const [text, setText] = useState('');
    const [recState, setRecState] = useState<RecordingState>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendAnimation, setSendAnimation] = useState<any>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<any>(null);
    const audioChunks = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

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
                if (recState !== 'idle') cancelRecording();
                else if (replyingTo) onCancelReply?.();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [recState, replyingTo, onCancelReply]);

    // Audio Playback cleanup
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current = recorder;
            recorder.start(200);
            setRecState('recording');
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime((prev: number) => prev + 1), 1000);
        } catch (err) {
            console.error('Mic access denied', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setRecState('review');
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.onstop = null;
            mediaRecorder.current.stop();
            audioChunks.current = [];
        }
        setRecState('idle');
        setAudioBlob(null);
        setAudioUrl(null);
        clearInterval(timerRef.current);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }
        setIsPlaying(false);
    };

    const sendRecording = async () => {
        if (!audioBlob) return;
        await handleUpload(audioBlob, 'audio');
        cancelRecording(); // Reset state after sending
    };

    const togglePlayback = () => {
        if (!audioUrl) return;

        if (!audioPlayerRef.current) {
            audioPlayerRef.current = new Audio(audioUrl);
            audioPlayerRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioPlayerRef.current.pause();
        } else {
            audioPlayerRef.current.play();
        }
        setIsPlaying(!isPlaying);
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
        <div className="p-3 md:p-8 md:pt-0 w-full max-w-6xl mx-auto">
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-2 px-2"
                    >
                        <div className="glass-panel rounded-2xl p-3 flex justify-between items-center bg-primary/5 border-primary/10 backdrop-blur-md">
                            <div className="flex flex-col gap-0.5 border-l-2 border-primary pl-3">
                                <span className="text-[10px] font-bold text-primary">Replying to {replyingTo.sender}</span>
                                <span className="text-muted-foreground truncate max-w-[200px] md:max-w-lg text-xs">{replyingTo.text || 'Attachment'}</span>
                            </div>
                            <button onClick={onCancelReply} className="p-2 hover:bg-black/5 rounded-full"><Icon name="x" className="w-4 h-4 opacity-50" /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div layout className={`glass-panel rounded-[1.5rem] md:rounded-[2rem] p-1.5 md:p-2 flex items-end gap-2 shadow-xl border-white/5 bg-background/40 backdrop-blur-xl ${cooldown > 0 ? 'opacity-50' : ''}`}>

                {/* --- Recording UI --- */}
                {recState === 'recording' && (
                    <div className="flex items-center justify-between w-full px-4 h-[56px] animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            />
                            <span className="text-foreground font-mono text-lg font-bold tracking-widest">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-4 animate-pulse">Recording...</span>
                            <button
                                onClick={stopRecording}
                                className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center text-white shadow-lg shadow-destructive/30 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Icon name="stop" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- Review UI --- */}
                {recState === 'review' && (
                    <div className="flex items-center justify-between w-full px-2 h-[56px] animate-in slide-in-from-bottom-2 duration-300">
                        <button
                            onClick={cancelRecording}
                            className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                        >
                            <Icon name="trash" className="w-5 h-5" />
                        </button>

                        <div className="flex-1 mx-4 h-10 bg-foreground/5 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={togglePlayback}>
                            {/* Simulated Waveform */}
                            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-30">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: isPlaying ? [10, 24, 10] : 10 }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                                        className="w-1 bg-primary rounded-full transition-all"
                                        style={{ height: '10px' }}
                                    />
                                ))}
                            </div>
                            <div className="z-10 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm">
                                <Icon name={isPlaying ? 'pause' : 'play'} className="w-4 h-4 text-primary ml-0.5" />
                            </div>
                        </div>

                        <button
                            onClick={sendRecording}
                            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                        >
                            {uploading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <Icon name="send" className="w-5 h-5 translate-x-0.5" />
                            )}
                        </button>
                    </div>
                )}

                {/* --- Default Text UI --- */}
                {recState === 'idle' && (
                    <>
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                            <Icon name="paperclip" className="w-6 h-6" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf" />

                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
                            placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "Message..."}
                            disabled={cooldown > 0}
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none resize-none py-3.5 max-h-[120px] text-[16px] placeholder:text-muted-foreground/40 leading-relaxed font-normal min-h-[50px]"
                        />

                        {text.trim() ? (
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSendText}
                                disabled={cooldown > 0}
                                className="p-3 bg-primary text-white rounded-full flex-shrink-0 shadow-lg mb-1 mr-1"
                            >
                                <Icon name="send" className="w-5 h-5 translate-x-0.5" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={startRecording}
                                className="p-3 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mb-1"
                            >
                                <Icon name="mic" className="w-6 h-6" />
                            </motion.button>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};
