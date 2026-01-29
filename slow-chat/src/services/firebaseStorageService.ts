import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
import { storage } from '../config/firebase';

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
 * Specifically for voice recordings
 */
export const uploadVoice = async (
    blob: Blob,
    groupId: string,
    userId: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    const filename = `voice_${Date.now()}.webm`;
    const path = `groups/${groupId}/voice/${userId}/${filename}`;
    return uploadFile(blob, path, onProgress);
};

/**
 * For images, videos, docs
 */
export const uploadMedia = async (
    file: File,
    groupId: string,
    userId: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    const filename = `${Date.now()}_${file.name}`;
    const path = `groups/${groupId}/media/${userId}/${filename}`;
    return uploadFile(file, path, onProgress);
};
