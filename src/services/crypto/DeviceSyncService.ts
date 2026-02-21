/**
 * DeviceSyncService.ts
 * Manages secure Identity Key transfer between devices via Firestore signalling.
 */

import { doc, setDoc, onSnapshot, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CryptoUtils } from './CryptoUtils';
import { vault } from './LocalVault';

export class DeviceSyncService {
    /**
     * OWNER (Primary device): Starts the sync session
     */
    static async startSyncSession(): Promise<{ sessionId: string; publicKey: string }> {
        const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Generate ephemeral key pair for this session
        const sessionKeys = await CryptoUtils.generateIdentityKeyPair();
        await vault.saveSecret(`sync_ephemeral_${sessionId}`, sessionKeys.privateKey);

        const pubKeyBase64 = await CryptoUtils.exportPublicKey(sessionKeys.publicKey);

        // Save session to Firestore
        await setDoc(doc(db, 'sync_sessions', sessionId), {
            ownerPublicKey: pubKeyBase64,
            createdAt: Date.now(),
            status: 'waiting'
        });

        return { sessionId, publicKey: pubKeyBase64 };
    }

    /**
     * OWNER: Listens for requests and responds
     */
    static listenForSyncRequests(sessionId: string, onComplete: () => void) {
        return onSnapshot(doc(db, 'sync_sessions', sessionId), async (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();

            if (data.status === 'requested' && data.newDevicePublicKey) {
                console.log("[Sync] Request received from new device. Responding...");

                try {
                    // 1. Get Identity Private Key
                    const identityPrivateKey = await vault.getSecret('identity_private_key');
                    if (!identityPrivateKey) throw new Error("Identity key missing locally.");

                    // 2. Derive Shared Secret with New Device
                    const sessionPrivateKey = await vault.getSecret(`sync_ephemeral_${sessionId}`);
                    const newDevicePubKey = await CryptoUtils.importPublicKey(data.newDevicePublicKey);
                    const sharedSecret = await CryptoUtils.deriveSharedSecret(sessionPrivateKey, newDevicePubKey);

                    // 3. Encrypt Identity Private Key
                    const exportedPrivate = await CryptoUtils.exportPrivateKey(identityPrivateKey);
                    const { ciphertext, iv } = await CryptoUtils.encryptAES(exportedPrivate, sharedSecret);

                    // 4. Send back and finalize
                    await updateDoc(doc(db, 'sync_sessions', sessionId), {
                        payload: ciphertext,
                        iv: iv,
                        status: 'completed'
                    });

                    // Cleanup local ephemeral after a delay
                    setTimeout(async () => {
                        await vault.deleteSecret(`sync_ephemeral_${sessionId}`);
                        // await deleteDoc(doc(db, 'sync_sessions', sessionId));
                    }, 5000);

                    onComplete();
                } catch (err) {
                    console.error("[Sync] Error responding to request:", err);
                }
            }
        });
    }

    /**
     * NEW DEVICE: Joins a session via QR
     */
    static async joinSyncSession(sessionId: string, ownerPublicKeyBase64: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Generate ephemeral key pair
                const myKeys = await CryptoUtils.generateIdentityKeyPair();
                const myPubKeyBase64 = await CryptoUtils.exportPublicKey(myKeys.publicKey);

                // 2. Submit request
                await updateDoc(doc(db, 'sync_sessions', sessionId), {
                    newDevicePublicKey: myPubKeyBase64,
                    status: 'requested'
                });

                // 3. Wait for payload
                const unsubscribe = onSnapshot(doc(db, 'sync_sessions', sessionId), async (snap) => {
                    const data = snap.data();
                    if (data?.status === 'completed' && data.payload) {
                        unsubscribe();

                        try {
                            const ownerPubKey = await CryptoUtils.importPublicKey(ownerPublicKeyBase64);
                            const sharedSecret = await CryptoUtils.deriveSharedSecret(myKeys.privateKey, ownerPubKey);

                            const decryptedPKCS8 = await CryptoUtils.decryptAES(data.payload, data.iv, sharedSecret);
                            const importedIdentity = await CryptoUtils.importPrivateKey(decryptedPKCS8);

                            await vault.saveSecret('identity_private_key', importedIdentity);
                            console.log("[Sync] Sync successful! Identity key imported.");
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}
