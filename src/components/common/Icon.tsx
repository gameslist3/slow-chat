import React from 'react';
import * as SolarIcons from '@solar-icons/react';
import { IconProps as SolarIconProps } from '@solar-icons/react';

/**
 * ICON REGISTRY SYSTEM
 * Migrated to Solar Icons (480 Design)
 */

export type IconName =
    | 'send' | 'mic' | 'paperclip' | 'smile' | 'stop' | 'play' | 'pause'
    | 'file' | 'image' | 'video' | 'zap' | 'user' | 'copy' | 'rotate'
    | 'thumbsUp' | 'thumbsDown' | 'message' | 'check' | 'checkCheck'
    | 'userPlus' | 'userMinus' | 'x' | 'sparkles' | 'users' | 'clock' | 'arrowLeft'
    | 'menu' | 'plus' | 'search' | 'logout' | 'compass' | 'settings' | 'mail'
    | 'lock' | 'eye' | 'eyeOff' | 'checkCircle' | 'xCircle' | 'arrowRight' | 'shuffle' | 'key' | 'shield' | 'help' | 'save' | 'phone' | 'bell' | 'bellOff' | 'trash' | 'sun' | 'moon';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    className?: string;
    size?: number;
}

const iconRegistry: Record<IconName, React.FC<any>> = {
    // Messaging
    send: SolarIcons.Plain,
    mic: SolarIcons.Microphone,
    paperclip: SolarIcons.Paperclip,
    smile: SolarIcons.SmileCircle,

    // Media Controls
    stop: SolarIcons.Stop,
    play: SolarIcons.Play,
    pause: SolarIcons.Pause,

    // Media Types
    file: SolarIcons.FileText,
    image: SolarIcons.Gallery,
    video: SolarIcons.VideocameraRecord,

    // Actions
    zap: SolarIcons.Bolt,
    user: SolarIcons.User,
    copy: SolarIcons.Copy,
    rotate: SolarIcons.Refresh,
    thumbsUp: SolarIcons.Like,
    thumbsDown: SolarIcons.Dislike,
    message: SolarIcons.ChatRoundDots,
    check: SolarIcons.CheckCircle,
    checkCheck: SolarIcons.CheckRead,
    userPlus: SolarIcons.UserPlus,
    userMinus: SolarIcons.UserMinus,
    x: SolarIcons.CloseCircle,
    sparkles: SolarIcons.Stars,
    users: SolarIcons.UsersGroupTwoRounded,
    clock: SolarIcons.ClockCircle,
    arrowLeft: SolarIcons.AltArrowLeft,
    arrowRight: SolarIcons.AltArrowRight,
    menu: SolarIcons.HamburgerMenu,
    plus: SolarIcons.AddCircle,
    search: SolarIcons.Magnifer,
    logout: SolarIcons.Logout,
    compass: SolarIcons.Compass,
    settings: SolarIcons.Settings,
    mail: SolarIcons.Letter,
    lock: SolarIcons.LockKeyhole,
    eye: SolarIcons.Eye,
    eyeOff: SolarIcons.EyeClosed,
    checkCircle: SolarIcons.CheckCircle,
    xCircle: SolarIcons.CloseCircle,
    shuffle: SolarIcons.Reorder,
    key: SolarIcons.Key,
    shield: SolarIcons.Shield,
    help: SolarIcons.QuestionCircle,
    save: SolarIcons.Diskette,
    phone: SolarIcons.Phone,
    bell: SolarIcons.Bell,
    bellOff: SolarIcons.BellOff,
    trash: SolarIcons.TrashBinTrash,
    sun: SolarIcons.Sun,
    moon: SolarIcons.Moon,
};

export const Icon: React.FC<IconProps> = ({ name, className, size = 24, ...props }) => {
    const IconComponent = iconRegistry[name];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in registry.`);
        return null;
    }

    // Solar icons use 'iconStyle' prop but standard spread works for className
    return <IconComponent className={className} size={size} {...props} />;
};
