/**
 * Cloudinary Upload Service
 * Handles image and audio uploads to Cloudinary
 */

const CLOUD_NAME = 'dn16gm6ka';
const UPLOAD_PRESET = 'slowchat_unsigned';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

export interface UploadResult {
    url: string;
    publicId: string;
    format: string;
    resourceType: 'image' | 'video' | 'raw';
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
    file: File,
    folder: string = 'slowchat-media'
): Promise<UploadResult> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', folder);

        // Determine resource type
        const resourceType = file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('audio/')
                ? 'video' // Cloudinary uses 'video' for audio
                : 'raw';

        const uploadUrl = CLOUDINARY_URL.replace('/upload', `/${resourceType}/upload`);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            resourceType: data.resource_type,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}

/**
 * Upload image file
 */
export async function uploadImage(file: File, subfolder?: string): Promise<string> {
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be less than 10MB');
    }

    const folder = subfolder ? `slowchat-media/${subfolder}/images` : 'slowchat-media/images';
    const result = await uploadToCloudinary(file, folder);
    return result.url;
}

/**
 * Upload audio file
 */
export async function uploadAudio(blob: Blob, subfolder?: string): Promise<string> {
    const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Audio must be less than 10MB');
    }

    const folder = subfolder ? `slowchat-media/${subfolder}/audio` : 'slowchat-media/audio';
    const result = await uploadToCloudinary(file, folder);
    return result.url;
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
    } = {}
): string {
    if (!url.includes('cloudinary.com')) return url;

    const { width = 800, height, quality = 80 } = options;

    // Insert transformation parameters
    const transformations = [
        `w_${width}`,
        height ? `h_${height}` : null,
        `q_${quality}`,
        'f_auto', // Auto format
    ].filter(Boolean).join(',');

    return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Delete file from Cloudinary (requires backend with API secret)
 * For now, this is a placeholder - actual deletion would need server-side code
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    console.warn('Cloudinary deletion requires backend API. File will remain in cloud:', publicId);
    // In production, you'd call your backend API which has the API secret
    // Backend would use: cloudinary.v2.uploader.destroy(publicId)
}
/**
 * For images, videos, docs (Matches Firebase interface)
 */
export const uploadMedia = async (
    file: File,
    groupId: string,
    userId: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    // Cloudinary fetch doesn't easily support progress for unsigned uploads without XHR,
    // so we simulate it or just let it be.
    onProgress(50);
    const result = await uploadToCloudinary(file, `slowchat-media/${groupId}/${userId}`);
    onProgress(100);
    return result.url;
};

/**
 * Specifically for voice recordings (Matches Firebase interface)
 */
export const uploadVoice = async (
    blob: Blob,
    groupId: string,
    userId: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    onProgress(50);
    const result = await uploadAudio(blob, `${groupId}/${userId}`);
    onProgress(100);
    return result;
};
