import React from 'react';
import { AIMessage } from './AIMessage';
import { AIComposer } from './AIComposer';

export const AIChat = () => {
    // Mock data for UI demonstration
    const messages = [
        { role: 'user', content: 'What are the main UI trends for 2026?' },
        {
            role: 'assistant',
            content: 'The 2026 UI landscape is dominated by high-end dark aesthetics, extreme roundedness, and seamless AI integration. \n\nKey trends include:\n- Glassmorphism 2.0 with deeper blurs\n- Micro-interactions for feedback\n- Conversational first layouts\n- Generative UI components'
        },
    ];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col h-full bg-ai-bg">
            <div className="flex-1 flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-16 h-16 rounded-3xl bg-ai-surface border border-white/5 flex items-center justify-center mb-6 shadow-ai-glow">
                            <span className="text-3xl">🎭</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">How can I help you today?</h2>
                        <p className="max-w-md text-muted-foreground">
                            I can help you build your next big idea or just chat about life.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col py-10">
                        {messages.map((msg, i) => (
                            <AIMessage key={i} role={msg.role as any} content={msg.content} />
                        ))}
                        <div className="h-64" /> {/* Spacer for composer overlay */}
                    </div>
                )}
            </div>
            <AIComposer />
        </div>
    );
};
