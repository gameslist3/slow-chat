import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

/**
 * ICON REGISTRY SYSTEM
 * To manually replace an icon:
 * 1. Drop your SVG/PNG into src/assets/icons/
 * 2. Update the mapping in 'iconRegistry' below
 */

export type IconName =
    | 'send' | 'mic' | 'paperclip' | 'smile' | 'stop' | 'play' | 'pause'
    | 'file' | 'image' | 'video' | 'zap' | 'user' | 'copy' | 'rotate'
    | 'thumbsUp' | 'thumbsDown' | 'message' | 'check' | 'checkCheck'
    | 'userPlus' | 'userMinus' | 'x' | 'sparkles' | 'users' | 'clock' | 'arrowLeft'
    | 'menu' | 'plus' | 'search' | 'logout' | 'compass' | 'settings' | 'mail'
    | 'lock' | 'eye' | 'eyeOff' | 'checkCircle' | 'xCircle' | 'arrowRight' | 'shuffle' | 'key' | 'shield' | 'help' | 'save' | 'phone';

interface IconProps extends LucideProps {
    name: IconName;
    className?: string;
}

const iconRegistry: Record<IconName, React.FC<any>> = {
    send: LucideIcons.Send,
    mic: LucideIcons.Mic,
    paperclip: LucideIcons.Paperclip,
    smile: LucideIcons.Smile,
    stop: LucideIcons.StopCircle,
    play: LucideIcons.Play,
    pause: LucideIcons.Pause,
    file: LucideIcons.FileText,
    image: LucideIcons.ImageIcon,
    video: LucideIcons.Video,
    zap: LucideIcons.Zap,
    user: LucideIcons.User,
    copy: LucideIcons.Copy,
    rotate: LucideIcons.RotateCw,
    thumbsUp: LucideIcons.ThumbsUp,
    thumbsDown: LucideIcons.ThumbsDown,
    message: LucideIcons.MessageSquare,
    check: LucideIcons.Check,
    checkCheck: LucideIcons.CheckCheck,
    userPlus: LucideIcons.UserPlus,
    userMinus: LucideIcons.UserMinus,
    x: LucideIcons.X,
    sparkles: LucideIcons.Sparkles,
    users: LucideIcons.Users,
    clock: LucideIcons.Clock,
    arrowLeft: LucideIcons.ArrowLeft,
    menu: LucideIcons.Menu,
    plus: LucideIcons.Plus,
    search: LucideIcons.Search,
    logout: LucideIcons.LogOut,
    compass: LucideIcons.Compass,
    settings: LucideIcons.Settings,
    mail: LucideIcons.Mail,
    lock: LucideIcons.Lock,
    eye: LucideIcons.Eye,
    eyeOff: LucideIcons.EyeOff,
    checkCircle: LucideIcons.CheckCircle2,
    xCircle: LucideIcons.XCircle,
    arrowRight: LucideIcons.ArrowRight,
    shuffle: LucideIcons.Shuffle,
    key: LucideIcons.Key,
    shield: LucideIcons.Shield,
    help: LucideIcons.HelpCircle,
    save: LucideIcons.Save,
    phone: LucideIcons.Phone,
};

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
    const IconComponent = iconRegistry[name];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in registry.`);
        return null;
    }

    return <IconComponent {...props} />;
};
