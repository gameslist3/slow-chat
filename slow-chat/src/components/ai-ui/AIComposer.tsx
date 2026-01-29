import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Smile, Paperclip } from 'lucide-react';
import { Button } from '../ui/Button';

export const AIComposer = () => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [text]);

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-10 pointer-events-none sticky bottom-0">
            <div className="pointer-events-auto relative glass-dark rounded-[28px] border border-white/10 shadow-2xl p-2 transition-all duration-300 focus-within:border-white/20 focus-within:shadow-ai-glow">
                <div className="flex items-end gap-2 pr-1">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground">
                        <Plus className="w-5 h-5" />
                    </Button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Message SlowChat AI..."
                        className="flex-1 bg-transparent border-0 focus:ring-0 px-2 py-3 text-[15px] resize-none max-h-[200px] placeholder:text-muted-foreground/50 transition-colors"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="flex items-center gap-1 mb-1">
                        <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
                            <Smile className="w-5 h-5" />
                        </Button>
                        <Button
                            disabled={!text.trim()}
                            className={`
                                rounded-full h-9 w-9 p-0 flex items-center justify-center transition-all
                                ${text.trim() ? 'bg-white text-black hover:scale-105 shadow-lg' : 'bg-white/10 text-white/30'}
                            `}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            </div>
            <p className="text-[11px] text-center mt-3 text-muted-foreground/60">
                SlowChat can make mistakes. Consider checking important information.
            </p>
        </div>
    );
};
