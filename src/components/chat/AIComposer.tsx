import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { uploadMedia, uploadVoice } from '../../services/cloudinaryService';
import { Message, FileMetadata } from '../../types';
import { useToast } from '../../context/ToastContext';

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
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<any>(null);
    const audioChunks = useRef<Blob[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [text]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunks.current = [];
            recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };
            mediaRecorder.current = recorder;
            recorder.start();
            setRecState('recording');
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(v => v + 1), 1000);
        } catch (err) {
            toast('Microphone access denied', 'error');
        }
    };

    const stopRecording = () => {
        mediaRecorder.current?.stop();
        setRecState('review');
        clearInterval(timerRef.current);
    };

    const handleSend = () => {
        if (!text.trim() || cooldown > 0) return;
        onSend({ text: text.trim(), type: 'text' });
        setText('');
        if (replyingTo) onCancelReply?.();
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return toast('File exceeds 10MB limit', 'error');

        setUploading(true);
        try {
            const url = await uploadMedia(file, groupId, userId);
            onSend({ media: { url, type: 'image', name: file.name, size: file.size }, type: 'image' });
        } catch (err) {
            toast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed bottom-8 left-0 right-0 z-50 px-4 md:px-0 pointer-events-none">
            <div className="max-w-2xl mx-auto pointer-events-auto">
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/5 rounded-t-2xl p-4 mb-[-1rem] flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-primary">Replying to</span>
                                    <span className="text-xs text-white opacity-60 truncate max-w-[200px]">{replyingTo.text}</span>
                                </div>
                            </div>
                            <button onClick={onCancelReply} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                                <Icon name="x" className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 shadow-[0_32px_64px_rgba(0,0,0,0.5)] flex items-end gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors group shrink-0"
                    >
                        <Icon name="plus" className="w-5 h-5 text-muted-foreground group-hover:text-white" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />

                    <div className="flex-1 py-3 px-1">
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Type a message..."
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium placeholder:text-muted-foreground/30 outline-none resize-none leading-relaxed text-white max-h-[120px] min-h-[24px]"
                            rows={1}
                        />
                    </div>

                    <div className="flex items-center gap-2 pr-1 pb-1">
                        {!text.trim() ? (
                            <button
                                onClick={recState === 'recording' ? stopRecording : startRecording}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${recState === 'recording' ? 'bg-rose-500 text-white animate-pulse' : 'hover:bg-white/5 text-muted-foreground'}`}
                            >
                                <Icon name="mic" className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={cooldown > 0}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cooldown > 0 ? 'bg-white/5 text-muted-foreground' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
                            >
                                {cooldown > 0 ? <span className="text-[10px] font-black">{cooldown}</span> : <Icon name="send" className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
