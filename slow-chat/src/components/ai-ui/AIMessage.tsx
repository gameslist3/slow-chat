import React from 'react';
import { User, Sparkles, Copy, ThumbsUp, ThumbsDown, RotateCw } from 'lucide-react';

interface AIMessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export const AIMessage: React.FC<AIMessageProps> = ({ role, content }) => {
    const isAssistant = role === 'assistant';

    return (
        <div className={`group w-full py-8 ${isAssistant ? 'bg-ai-surface/30' : ''}`}>
            <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 px-4">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${isAssistant ? 'bg-ai-accent border-ai-accent/30 text-white shadow-ai-glow' : 'bg-ai-surface border-border text-foreground'}`}>
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <p className="font-bold text-sm tracking-wide uppercase opacity-50">
                        {isAssistant ? 'SlowChat AI' : 'You'}
                    </p>

                    <div className="text-[15px] leading-relaxed text-foreground/90 markdown-content space-y-4">
                        {content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>

                    {isAssistant && (
                        <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-lg hover:bg-ai-hover text-muted-foreground transition-colors" title="Copy">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-ai-hover text-muted-foreground transition-colors">
                                <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-ai-hover text-muted-foreground transition-colors">
                                <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-ai-hover text-muted-foreground transition-colors" title="Regenerate">
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
