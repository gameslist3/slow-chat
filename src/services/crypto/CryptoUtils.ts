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

    // Encrypt ArrayBuffer using AES-GCM
    static async encryptBuffer(data: ArrayBuffer, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );
        return { ciphertext, iv };
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

    // Decrypt ArrayBuffer using AES-GCM
    static async decryptBuffer(data: ArrayBuffer, iv: BufferSource, key: CryptoKey): Promise<ArrayBuffer> {
        return await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );
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

    // PBKDF2: Derive AES key from password
    static async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt as any,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt with password (for backup)
    static async encryptWithPassword(text: string, password: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await this.deriveKeyFromPassword(password, salt);
        const { ciphertext, iv } = await this.encryptAES(text, key);

        return {
            ciphertext,
            iv,
            salt: btoa(String.fromCharCode(...salt))
        };
    }

    // Decrypt with password (for recovery)
    static async decryptWithPassword(ciphertext: string, iv: string, salt: string, password: string): Promise<string> {
        const saltBytes = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
        const key = await this.deriveKeyFromPassword(password, saltBytes);
        return this.decryptAES(ciphertext, iv, key);
    }
}
