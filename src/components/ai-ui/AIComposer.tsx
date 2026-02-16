import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Icon } from '../common/Icon';
import { motion } from 'framer-motion';

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
        <div className="w-full max-w-4xl mx-auto p-4 md:p-10 pointer-events-none sticky bottom-0">
            <div className="pointer-events-auto relative bg-[#0B1220]/60 backdrop-blur-2xl rounded-[2rem] border border-white/5 shadow-2xl p-3 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#A9B4D0] hover:text-white transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Type something..."
                        className="flex-1 bg-transparent border-0 focus:ring-0 px-2 py-3 text-[15px] resize-none max-h-[200px] text-white placeholder-[#7C89A6] transition-colors outline-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />

                    <div className="flex items-center gap-2">
                        <button
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#A9B4D0] hover:text-white transition-colors"
                        >
                            <Icon name="mic" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
