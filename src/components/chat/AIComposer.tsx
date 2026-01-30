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
                {isRecording ? (
                    <div className="flex items-center justify-between w-full px-4 h-[56px]">
                        <div className="flex items-center gap-3">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 h-3 rounded-full bg-destructive" />
                            <span className="text-destructive font-mono text-lg font-medium">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={cancelRecording} className="p-2 text-muted-foreground hover:text-destructive"><Icon name="trash" className="w-5 h-5" /></button>
                            <button onClick={stopRecording} className="p-2 bg-destructive text-white rounded-full"><Icon name="send" className="w-5 h-5" /></button>
                        </div>
                    </div>
                ) : (
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
