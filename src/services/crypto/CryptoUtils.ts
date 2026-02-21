/**
 * CryptoUtils.ts
 * Wrapper for Web Crypto API for E2EE operations.
 */

import { vault } from './LocalVault';

export class CryptoUtils {
    // Generate Identity Key Pair (Long-term)
    static async generateIdentityKeyPair(): Promise<CryptoKeyPair> {
        return window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true, // extractable
            ['deriveKey', 'deriveBits']
        );
    }

    // Export public key to base64 for Firestore
    static async exportPublicKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey('spki', key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    // Import public key from base64
    static async importPublicKey(base64: string): Promise<CryptoKey> {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return window.crypto.subtle.importKey(
            'spki',
            bytes,
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true,
            []
        );
    }

    // Encrypt content using AES-GCM
    static async encryptAES(text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encoded
        );

        return {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    // Decrypt content using AES-GCM
    static async decryptAES(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
        const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
        const ciphertext = new Uint8Array(atob(ciphertextBase64).split('').map(c => c.charCodeAt(0)));

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    }

    // Derive Shared Secret (Diffie-Hellman)
    static async deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
        return window.crypto.subtle.deriveKey(
            {
                name: 'ECDH',
                public: publicKey
            },
            privateKey,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Establish Session with Peer
    static async establishSession(peerId: string, peerPublicKeyBase64: string): Promise<CryptoKey> {
        const privateKey = await vault.getSecret('identity_private_key');
        if (!privateKey) throw new Error("Local identity key missing. Device sync required.");

        const peerPublicKey = await this.importPublicKey(peerPublicKeyBase64);
        const sharedKey = await this.deriveSharedSecret(privateKey, peerPublicKey);

        // Save the session key for this peer
        await vault.saveSecret(`session_${peerId}`, sharedKey);
        return sharedKey;
    }

    // Get existing session key or return null
    static async getSessionKey(peerId: string): Promise<CryptoKey | null> {
        return await vault.getSecret(`session_${peerId}`);
    }

    // Export private key to base64 for device sync
    static async exportPrivateKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey('pkcs8', key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    // Import private key from base64
    static async importPrivateKey(base64: string): Promise<CryptoKey> {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return window.crypto.subtle.importKey(
            'pkcs8',
            bytes,
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true,
            ['deriveKey', 'deriveBits']
        );
    }

    // Generate Symmetric Key for Group/Storage
    static async generateAESKey(): Promise<CryptoKey> {
        return window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Export raw key bytes to base64
    static async exportRawKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey('raw', key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    // Import raw key bytes from base64
    static async importRawKey(base64: string): Promise<CryptoKey> {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return window.crypto.subtle.importKey(
            'raw',
            bytes,
            'AES-GCM',
            true,
            ['encrypt', 'decrypt']
        );
    }
}
