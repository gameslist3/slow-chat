import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCooldown } from '../../hooks/useCooldown';

interface ChatInputProps {
    groupId: string;
    memberCount: number;
    onSend: (text: string) => void;
    onUpload?: (file: File) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ groupId, memberCount, onSend, onUpload }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { remaining, triggerCooldown } = useCooldown(groupId, memberCount);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [text]);

    const handleSend = () => {
        if (!text.trim() || remaining > 0) return;
        onSend(text);
        setText('');
        triggerCooldown();
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onUpload) {
            onUpload(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-white border-t border-gray-100 p-3 md:p-4 w-full sticky bottom-0 z-20">
            <div className="max-w-4xl mx-auto flex items-end gap-2 md:gap-3 transition-all">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                />

                <Button
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full h-10 w-10 flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus className="w-6 h-6" />
                </Button>

                <div className="flex-1 bg-gray-50 rounded-[24px] border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 focus-within:bg-white transition-all flex items-center px-2 py-1">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder={remaining > 0 ? `Wait ${remaining}s...` : "Type a message..."}
                        className="w-full bg-transparent border-0 focus:ring-0 p-2 max-h-32 resize-none text-gray-900 placeholder:text-gray-400 text-base leading-relaxed"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={remaining > 0}
                    />
                </div>

                <Button
                    onClick={handleSend}
                    disabled={!text.trim() || remaining > 0}
                    size="icon"
                    className={`mb-0.5 rounded-full h-10 w-10 flex-shrink-0 transition-all shadow-sm ${text.trim() && remaining === 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                >
                    {remaining > 0 ? (
                        <span className="font-mono text-xs font-bold">{remaining}</span>
                    ) : (
                        <Send className="w-5 h-5 ml-0.5" />
                    )}
                </Button>
            </div>
        </div>
    );
};
