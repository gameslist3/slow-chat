import React from 'react';
import { Menu, ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';

interface MobileHeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    onMenuToggle?: () => void;
    rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    title = "SlowChat",
    showBack,
    onBack,
    onMenuToggle,
    rightAction
}) => {
    return (
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-2">
                {showBack ? (
                    <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" onClick={onMenuToggle} className="-ml-2">
                        <Menu className="w-5 h-5 text-gray-700" />
                    </Button>
                )}
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] animate-in fade-in slide-in-from-left-2 direction-300">
                    {title}
                </h1>
            </div>

            <div className="flex items-center">
                {rightAction}
            </div>
        </div>
    );
};
