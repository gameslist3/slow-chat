import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { Group } from '../../types';

interface MainLayoutProps {
    children: React.ReactNode;
    userGroups: Group[];
    activeGroupId: string | null;
    onSelectGroup: (groupId: string) => void;
    onCreateGroup: () => void;
    onBrowseGroups: () => void;

    // Mobile specific Layout props
    mobileTitle?: string;
    showMobileBack?: boolean;
    onMobileBack?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    userGroups,
    activeGroupId,
    onSelectGroup,
    onCreateGroup,
    onBrowseGroups,
    mobileTitle,
    showMobileBack,
    onMobileBack
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Sidebar - Desktop persistent / Mobile Drawer */}
            <Sidebar
                groups={userGroups}
                activeGroupId={activeGroupId}
                onSelectGroup={onSelectGroup}
                onCreateGroup={onCreateGroup}
                onBrowseGroups={onBrowseGroups}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background w-full">
                <MobileHeader
                    title={mobileTitle}
                    showBack={showMobileBack}
                    onBack={onMobileBack}
                    onMenuToggle={() => setIsSidebarOpen(true)}
                />
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </main>
        </div>
    );
};
