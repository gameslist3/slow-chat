import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { uploadVoice, uploadMedia } from '../../services/cloudinaryService';
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
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setRecState('review');
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
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
    };

    const handleSendVoice = async () => {
        if (!audioBlob) return;
        setUploading(true);
        try {
            const url = await uploadVoice(audioBlob, groupId, userId, () => { });
            onSend({ media: { url, type: 'audio', name: 'voice_note.webm', size: audioBlob.size }, type: 'audio' });
            setRecState('idle');
            setAudioBlob(null);
            setAudioUrl(null);
        } catch (err) {
            toast('Voice upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSendText = () => {
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
            const url = await uploadMedia(file, groupId, userId, () => { });
            onSend({ media: { url, type: 'image', name: file.name, size: file.size }, type: 'image' });
        } catch (err) {
            toast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full pb-8 px-4 flex justify-center items-end bg-transparent pointer-events-none">
            <div className="w-full max-w-2xl pointer-events-auto relative">
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-surface/90 backdrop-blur-xl border border-border rounded-t-2xl p-4 mb-[-1rem] flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-primary">Replying to</span>
                                    <span className="text-xs text-foreground opacity-60 truncate max-w-[200px]">{replyingTo.text}</span>
                                </div>
                            </div>
                            <button onClick={onCancelReply} className="w-8 h-8 rounded-lg hover:bg-foreground/5 flex items-center justify-center text-muted-foreground">
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="glass-panel rounded-[2rem] p-1.5 shadow-2xl flex items-end gap-2 border-border">
                    {recState === 'idle' && (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-12 h-12 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors group shrink-0"
                            >
                                <Icon name="plus" className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" />

                            <div className="flex-1 py-2.5 px-2">
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendText())}
                                    placeholder="Type your message..."
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium placeholder:text-muted-foreground/30 outline-none resize-none leading-relaxed text-foreground max-h-[100px] min-h-[20px]"
                                    rows={1}
                                />
                            </div>

                            <div className="flex items-center gap-2 pr-1 pb-1">
                                {!text.trim() ? (
                                    <button
                                        onClick={startRecording}
                                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-foreground/5 text-muted-foreground"
                                    >
                                        <Icon name="mic" className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSendText}
                                        disabled={cooldown > 0}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cooldown > 0 ? 'bg-muted text-muted-foreground' : 'bg-primary text-white shadow-lg active:scale-95'}`}
                                    >
                                        {cooldown > 0 ? <span className="text-[10px] font-black">{cooldown}</span> : <Icon name="send" className="w-5 h-5" />}
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {recState === 'recording' && (
                        <div className="flex-1 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                                <span className="font-mono text-sm font-bold tracking-widest">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <button
                                onClick={stopRecording}
                                className="h-10 px-6 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                Stop
                            </button>
                        </div>
                    )}

                    {recState === 'review' && (
                        <div className="flex-1 flex items-center justify-between px-4 py-2">
                            <button
                                onClick={() => { setRecState('idle'); setAudioBlob(null); setAudioUrl(null); }}
                                className="w-10 h-10 rounded-full hover:bg-rose-500/10 text-rose-500 flex items-center justify-center"
                            >
                                <Icon name="trash" className="w-5 h-5" />
                            </button>

                            <div className="flex-1 px-4 relative flex items-center h-10 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent animate-pulse" />
                                {audioUrl && <audio src={audioUrl} controls className="w-full h-8 opacity-80" />}
                            </div>

                            <button
                                onClick={handleSendVoice}
                                disabled={uploading}
                                className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {uploading ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : <Icon name="send" className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
