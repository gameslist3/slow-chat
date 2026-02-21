import React, { useState, useEffect } from 'react';
import { FileMetadata } from '../../types';
import { CryptoUtils } from '../../services/crypto/CryptoUtils';
import { Icon } from '../common/Icon';

interface EncryptedMediaProps {
    media: FileMetadata;
    type: string; // matches Message['type']
    className?: string;
    render: (url: string) => React.ReactNode;
}

export const EncryptedMedia: React.FC<EncryptedMediaProps> = ({ media, type, className, render }) => {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let objectUrl: string | null = null;

        const decrypt = async () => {
            if (!media.encKey || !media.encIv) {
                // Not encrypted or missing keys (fallback to plain url)
                setDecryptedUrl(media.url);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // 1. Fetch encrypted binary from storage
                const response = await fetch(media.url);
                if (!response.ok) throw new Error('Failed to fetch encrypted media');
                const encryptedBuffer = await response.arrayBuffer();

                // 2. Prep keys
                const key = await CryptoUtils.importRawKey(media.encKey);
                const iv = new Uint8Array(atob(media.encIv).split('').map(c => c.charCodeAt(0)));

                // 3. Decrypt
                const decryptedBuffer = await CryptoUtils.decryptBuffer(encryptedBuffer, iv, key);

                // 4. Create local URL
                if (isMounted) {
                    const mimeTypeMap: Record<string, string> = {
                        'audio': 'audio/webm',
                        'image': 'image/jpeg',
                        'video': 'video/mp4',
                        'pdf': 'application/pdf',
                        'doc': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    };

                    const blob = new Blob([decryptedBuffer], {
                        type: mimeTypeMap[type] || 'application/octet-stream'
                    });
                    objectUrl = URL.createObjectURL(blob);
                    setDecryptedUrl(objectUrl);
                }
            } catch (err: any) {
                console.error('[EncryptedMedia] Decryption error:', err);
                if (isMounted) setError('Failed to decrypt media');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        decrypt();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [media.url, media.encKey, media.encIv, type]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-white/5 rounded-xl animate-pulse ${className}`} style={{ minHeight: '100px' }}>
                <div className="flex flex-col items-center gap-2">
                    <Icon name="rotate" className="w-5 h-5 text-primary/40 animate-spin" />
                    <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">Decrypting</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-red-500/10 rounded-xl border border-red-500/20 ${className}`} style={{ minHeight: '100px' }}>
                <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest px-4 text-center">
                    {error}
                </div>
            </div>
        );
    }

    if (!decryptedUrl) return null;

    return <>{render(decryptedUrl)}</>;
};
