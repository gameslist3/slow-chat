import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { CryptoUtils } from './crypto/CryptoUtils';

export interface UploadProgress {
    progress: number;
    url?: string;
    error?: string;
}

/**
 * Upload a file to Firebase Storage with progress tracking
 * @param file The file or blob to upload
 * @param path The path in storage (e.g., 'groups/groupId/messages')
 * @param onProgress Callback for tracking upload progress
 */
export const uploadFile = (
    file: File | Blob,
    path: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error('[Storage] Upload error:', error);
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
};

/**
 * Upload a file with E2EE
 */
export const uploadEncryptedFile = async (
    file: File | Blob,
    path: string,
    onProgress: (progress: number) => void
): Promise<{ url: string; key: string; iv: string }> => {
    // 1. Generate per-file key
    const aesKey = await CryptoUtils.generateAESKey();

    // 2. Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();

    // 3. Encrypt buffer
    const { ciphertext, iv } = await CryptoUtils.encryptBuffer(buffer, aesKey);

    // 4. Upload ciphertext (as a generic blob)
    const url = await uploadFile(new Blob([ciphertext]), path, onProgress);

    // 5. Export key and IV for storage in message
    const exportedKey = await CryptoUtils.exportRawKey(aesKey);
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return { url, key: exportedKey, iv: ivBase64 };
};

/**
 * Specifically for voice recordings
 */
export const uploadVoice = async (
    blob: Blob,
    chatId: string,
    userId: string,
    isPersonal: boolean,
    onProgress: (progress: number) => void
): Promise<{ url: string; key: string; iv: string }> => {
    const filename = `voice_${Date.now()}.enc`;
    const prefix = isPersonal ? 'chats' : 'groups';
    const path = `${prefix}/${chatId}/voice/${userId}/${filename}`;
    return uploadEncryptedFile(blob, path, onProgress);
};

export const uploadMedia = async (
    file: File,
    chatId: string,
    userId: string,
    isPersonal: boolean,
    onProgress: (progress: number) => void
): Promise<{ url: string; key: string; iv: string }> => {
    const filename = `${Date.now()}_${file.name}.enc`;
    const prefix = isPersonal ? 'chats' : 'groups';
    const path = `${prefix}/${chatId}/media/${userId}/${filename}`;
    return uploadEncryptedFile(file, path, onProgress);
};
