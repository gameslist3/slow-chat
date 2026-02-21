/**
 * GroupEncryptionService.ts
 * Implements Sender Keys protocol for E2EE Group Chats.
 */

import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CryptoUtils } from './CryptoUtils';
import { vault } from './LocalVault';
import { getUserById } from '../../services/firebaseAuthService';

export class GroupEncryptionService {
    /**
     * Get or Generate my Sender Key for a group.
     */
    static async getMySenderKey(groupId: string): Promise<CryptoKey> {
        const keyId = `group_sender_${groupId}`;
        let key = await vault.getSecret(keyId);

        if (!key) {
            console.log(`[GroupE2EE] Generating new sender key for group: ${groupId}`);
            key = await CryptoUtils.generateAESKey();
            await vault.saveSecret(keyId, key);
        }

        return key;
    }

    /**
     * Distribute my sender key to all other group members.
     */
    static async distributeMyKey(groupId: string, memberIds: string[], myId: string): Promise<void> {
        const mySenderKey = await this.getMySenderKey(groupId);
        const rawKey = await CryptoUtils.exportRawKey(mySenderKey);

        await Promise.all(memberIds.map(async (recipientId) => {
            if (recipientId === myId) return;

            try {
                // Check if we already distributed this version (optional optimization)

                // 1. Establish/Get P2P Session with recipient
                let sessionKey = await CryptoUtils.getSessionKey(recipientId);
                if (!sessionKey) {
                    const peerDoc = await getUserById(recipientId);
                    const pubKey = peerDoc?.publicKeys?.identity;
                    if (pubKey) {
                        sessionKey = await CryptoUtils.establishSession(recipientId, pubKey);
                    }
                }

                if (!sessionKey) throw new Error(`Could not establish session with ${recipientId}`);

                // 2. Encrypt our Sender Key for this recipient
                const { ciphertext, iv } = await CryptoUtils.encryptAES(rawKey, sessionKey);

                // 3. Store in the keys sub-collection
                // groups/{groupId}/keys/{recipientId} -> data: { [myId]: { key, iv } }
                const keyRef = doc(db, 'groups', groupId, 'keys', recipientId);
                await setDoc(keyRef, {
                    [myId]: {
                        payload: ciphertext,
                        iv: iv,
                        updatedAt: Date.now()
                    }
                }, { merge: true });

            } catch (err) {
                console.error(`[GroupE2EE] Failed to distribute key to ${recipientId}:`, err);
            }
        }));
    }

    /**
     * Load a peer's sender key for a group.
     */
    static async getPeerSenderKey(groupId: string, peerId: string, myId: string): Promise<CryptoKey | null> {
        const vaultId = `group_peer_${groupId}_${peerId}`;
        let key = await vault.getSecret(vaultId);

        if (key) return key;

        // Try to fetch from Firestore
        const keyDocRef = doc(db, 'groups', groupId, 'keys', myId);
        const snap = await getDoc(keyDocRef);

        if (snap.exists()) {
            const data = snap.data();
            const peerKeyData = data[peerId];

            if (peerKeyData) {
                try {
                    let sessionKey = await CryptoUtils.getSessionKey(peerId);
                    if (!sessionKey) {
                        const peerDoc = await getUserById(peerId);
                        const pubKey = peerDoc?.publicKeys?.identity;
                        if (pubKey) {
                            sessionKey = await CryptoUtils.establishSession(peerId, pubKey);
                        }
                    }

                    if (sessionKey) {
                        const rawKey = await CryptoUtils.decryptAES(peerKeyData.payload, peerKeyData.iv, sessionKey);
                        const importedKey = await CryptoUtils.importRawKey(rawKey);
                        await vault.saveSecret(vaultId, importedKey);
                        return importedKey;
                    }
                } catch (err) {
                    console.error(`[GroupE2EE] Failed to decrypt peer key from ${peerId}:`, err);
                }
            }
        }

        return null;
    }
}
