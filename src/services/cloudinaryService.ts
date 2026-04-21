import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadResult {
    url: string;
    publicId: string;
    format: string;
    resourceType: 'image' | 'video' | 'raw';
}

export async function uploadToStorage(
    file: File | Blob,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file as Blob);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
            },
            (error) => {
                console.error('Firebase Storage upload error:', error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}

export async function uploadImage(file: File, subfolder?: string): Promise<string> {
    const folder = subfolder ? `media/${subfolder}/images` : 'media/images';
    const path = `${folder}/${Date.now()}_${file.name}`;
    return uploadToStorage(file, path);
}

export async function uploadAudio(blob: Blob, subfolder?: string): Promise<string> {
    const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
    const folder = subfolder ? `media/${subfolder}/audio` : 'media/audio';
    const path = `${folder}/${file.name}`;
    return uploadToStorage(file, path);
}

export function getOptimizedImageUrl(
    url: string,
    options: { width?: number; height?: number; quality?: number; } = {}
): string {
    return url; // Firebase doesn't auto-optimize via URL parameters without extensions
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
    console.warn('Delete not implemented for Firebase Storage direct paths.');
}

export const uploadMedia = async (
    file: File,
    groupId: string,
    userId: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    const path = `gapes-media/${groupId}/${userId}/${Date.now()}_${file.name}`;
    return uploadToStorage(file, path, onProgress);
};

export const uploadVoice = async (
    blob: Blob,
    groupId: string,
    userId: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    const path = `gapes-media/${groupId}/${userId}/audio-${Date.now()}.webm`;
    return uploadToStorage(blob, path, onProgress);
};
