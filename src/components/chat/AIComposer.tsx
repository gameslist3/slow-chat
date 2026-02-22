import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { uploadVoice, uploadMedia } from '../../services/firebaseStorageService';
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
    const [isPlaying, setIsPlaying] = useState(false);

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
        if (!userId) {
            toast('User identity not syncronized', 'error');
            return;
        }

        setUploading(true);
        console.log(`[AIComposer] Starting voice upload for user: ${userId}, group: ${groupId}`);

        try {
            const { url, key, iv } = await uploadVoice(audioBlob, groupId, userId, (p) => {
                console.log(`[AIComposer] Voice upload progress: ${p.toFixed(0)}%`);
            });

            console.log('[AIComposer] Voice upload successful, sending message signal');

            onSend({
                media: {
                    url,
                    type: 'audio',
                    name: 'voice_note.enc',
                    size: audioBlob.size,
                    encKey: key,
                    encIv: iv
                },
                type: 'audio'
            });

            setRecState('idle');
            setAudioBlob(null);
            setAudioUrl(null);
            toast('Sent voice note', 'success');
        } catch (err: any) {
            console.error('[AIComposer] Voice send failed:', err);
            toast(`Voice upload failed: ${err.message || 'Check connection'}`, 'error');
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
            const { url, key, iv } = await uploadMedia(file, groupId, userId, () => { });
            onSend({
                media: {
                    url,
                    type: 'image',
                    name: file.name,
                    size: file.size,
                    encKey: key,
                    encIv: iv
                },
                type: 'image'
            });
        } catch (err) {
            toast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full z-50 px-4 pb-10 md:pb-6 pt-2 pointer-events-none shrink-0 flex justify-center">
            <div className="w-full max-w-3xl pointer-events-auto relative">
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-2 left-0 right-0 bg-[#0F1C34]/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl backdrop-blur-xl mx-4"
                        >
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] font-bold text-[#5B79B7] mb-0.5 uppercase tracking-wider">Replying to</span>
                                <span className="text-sm text-[#E6ECFF] truncate max-w-xs">{replyingTo.text}</span>
                            </div>
                            <button onClick={onCancelReply} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Icon name="x" className="w-4 h-4 text-[#A9B4D0]" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {recState === 'idle' ? (
                    <div className="flex items-end gap-4 bg-[#152238]/80 backdrop-blur-xl border border-white/5 p-3 rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all focus-within:border-primary/30">
                        {/* Attachment Button */}
                        <div className="pb-1.5 flex items-center justify-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-[#A9B4D0] hover:text-white shrink-0"
                            >
                                <Icon name="plus" className="w-5 h-5" />
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} />

                        {/* Text Input */}
                        <div className="flex-1 py-3 px-1">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendText())}
                                placeholder="Message"
                                className="w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-[15px] placeholder:text-[#64748B] text-[#E6ECFF] resize-none max-h-[120px] min-h-[24px] custom-scrollbar leading-relaxed"
                                rows={1}
                            />
                        </div>

                        {/* Mic / Send Button */}
                        <div className="pb-1.5 flex items-center justify-center">
                            <button
                                onClick={text.trim() ? handleSendText : startRecording}
                                disabled={cooldown > 0}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0
                                    ${text.trim()
                                        ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:scale-105 shadow-blue-500/20'
                                        : 'bg-[#1E3A8A]/50 text-[#7FA6FF] hover:bg-[#1E3A8A] hover:text-white'}
                                `}
                            >
                                {text.trim() ? <Icon name="send" className="w-5 h-5 ml-1" /> : <Icon name="mic" className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Recording State Pill */
                    <div className="flex items-center gap-4 bg-[#EF4444]/10 backdrop-blur-xl border border-[#EF4444]/20 p-2 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-2">
                        <button
                            onClick={() => { stopRecording(); setRecState('idle'); setAudioBlob(null); setAudioUrl(null); }}
                            disabled={recState === 'recording'}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                                ${recState === 'recording' ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444]'}
                            `}
                        >
                            <Icon name="trash" className="w-5 h-5" />
                        </button>

                        {recState === 'recording' ? (
                            <div className="flex-1 flex items-center gap-4 min-w-[200px]">
                                <div className="w-3 h-3 rounded-full bg-[#EF4444] animate-pulse shadow-[0_0_10px_#EF4444]" />
                                <div className="flex-1 h-8 flex items-center gap-1 opacity-80">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-[#EF4444] rounded-full animate-bounce"
                                            style={{
                                                height: `${Math.random() * 60 + 20}%`,
                                                animationDelay: `${i * 0.05}s`
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="font-mono text-sm font-bold text-[#E6ECFF] w-[50px] text-right">
                                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </span>
                                <button onClick={stopRecording} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <div className="w-3 h-3 bg-current rounded-sm" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center gap-3 min-w-[200px]">
                                <div className="flex-1 h-10 bg-black/20 rounded-full overflow-hidden flex items-center px-4 gap-3 border border-white/5">
                                    <button onClick={() => {
                                        const a = document.getElementById('preview-audio') as HTMLAudioElement;
                                        if (a.paused) { a.play(); setIsPlaying(true); } else { a.pause(); setIsPlaying(false); }
                                    }}>
                                        <Icon name={isPlaying ? "pause" : "play"} className="w-3 h-3 text-[#E6ECFF]" />
                                    </button>
                                    <div className="flex-1 h-6 flex items-center gap-0.5 opacity-60">
                                        {[...Array(20)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-0.5 bg-[#E6ECFF] rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                                                style={{ height: isPlaying ? `${Math.random() * 80 + 20}%` : '20%', transition: 'all 0.2s' }}
                                            />
                                        ))}
                                    </div>
                                    <audio
                                        id="preview-audio"
                                        src={audioUrl!}
                                        className="hidden"
                                        onEnded={() => setIsPlaying(false)}
                                        onPause={() => setIsPlaying(false)}
                                        onPlay={() => setIsPlaying(true)}
                                    />
                                </div>
                                <button
                                    onClick={handleSendVoice}
                                    disabled={uploading}
                                    className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {uploading ? <Icon name="rotate" className="w-4 h-4 animate-spin" /> : <Icon name="send" className="w-4 h-4 ml-0.5" />}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

