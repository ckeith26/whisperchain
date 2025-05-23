/**
 * Utility functions for cryptographic operations
 */

/**
 * Generates an RSA key pair for secure messaging and stores the private key
 * @returns {Promise<{publicKey: string, privateKey: string}>} The generated key pair in base64 format
 */
export const generateKeyPair = async () => {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );

    // Export public key to base64 format
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const publicKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(publicKeyBuffer))
    );

    // Export private key to base64 format
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const privateKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(privateKeyBuffer))
    );

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
    };
  } catch (error) {
    console.error("Key generation error:", error);
    throw new Error("Failed to generate encryption keys");
  }
};

/**
 * Encrypts a message using a recipient's public key
 * @param {string} message - The message to encrypt
 * @param {string} recipientPublicKeyBase64 - Recipient's public key in base64
 * @returns {Promise<string>} Encrypted message in base64
 */
export const encryptMessage = async (message, recipientPublicKeyBase64) => {
  try {
    // Convert base64 public key back to CryptoKey
    const publicKeyBuffer = Uint8Array.from(
      atob(recipientPublicKeyBase64),
      (c) => c.charCodeAt(0)
    );
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );

    // Encrypt the message
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      messageBuffer
    );

    // Convert to base64
    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypts a message using the user's private key
 * @param {string} encryptedMessageBase64 - Encrypted message in base64
 * @returns {Promise<string>} Decrypted message
 */
export const decryptMessage = async (encryptedMessageBase64) => {
  try {
    // Get stored private key
    const privateKeyBase64 = localStorage.getItem("privateKey");
    if (!privateKeyBase64) {
      throw new Error(
        "No private key found. Please generate a key pair first."
      );
    }

    // Convert base64 private key back to CryptoKey
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), (c) =>
      c.charCodeAt(0)
    );
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );

    // Decrypt the message
    const encryptedBuffer = Uint8Array.from(atob(encryptedMessageBase64), (c) =>
      c.charCodeAt(0)
    );
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBuffer
    );

    // Convert back to text
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt message");
  }
};

/**
 * Encrypts a message using the moderator's public key
 * @param {string} message - The message to encrypt
 * @returns {Promise<string>} Encrypted message in base64
 */
export const encryptForModerator = async (message) => {
  try {
    // Hardcoded moderator public key
    const MODERATOR_PUBLIC_KEY =
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxH0/X1Ey9MdGNnXHGT/ZmG3lY8zTgf85HZMi3ISqwS3QDH/lPgQUx+9HHcvM7kpbB03LsDsZ58rWPVjwCKL4/rpoItVKTWNmEkc4qVii//ZSP52RP2etxyh9DaBa0Y1QylnRLX6Br3WqEpYko1V8ZsgyeUQwh9m9jH0T3prtnDMyIznH9MVNwbqRrfNbiMzxwHyvUzVjTLGZ2161y7Z86wvg8DzbedJpGjuROW15rpq9LzAcJNb7r8JP/+6d//zafdMZ4gn9eG4FWI78QarCt4es0itwqNQboOTRujEmR7ixNDwdPV9CaUsa+BfpPNAVK1x7kQ5h6zvBpFW7btdEMQIDAQAB";

    // Convert base64 public key back to CryptoKey
    const publicKeyBuffer = Uint8Array.from(atob(MODERATOR_PUBLIC_KEY), (c) =>
      c.charCodeAt(0)
    );
    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );

    // Encrypt the message
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      messageBuffer
    );

    // Convert to base64
    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch (error) {
    console.error("Moderator encryption error:", error);
    throw new Error("Failed to encrypt message for moderator");
  }
};

/**
 * Decrypts a message using the moderator's private key
 * @param {string} encryptedMessageBase64 - Encrypted message in base64
 * @returns {Promise<string>} Decrypted message
 */
export const decryptAsModerator = async (encryptedMessageBase64) => {
  try {
    // Get moderator's private key from localStorage
    const storedKeyPair = localStorage.getItem("moderatorKeyPair");
    if (!storedKeyPair) {
      throw new Error(
        "No moderator key pair found. Please generate one first."
      );
    }

    const { privateKey } = JSON.parse(storedKeyPair);

    // Convert base64 private key back to CryptoKey
    const privateKeyBuffer = Uint8Array.from(atob(privateKey), (c) =>
      c.charCodeAt(0)
    );
    const cryptoKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );

    // Decrypt the message
    const encryptedBuffer = Uint8Array.from(atob(encryptedMessageBase64), (c) =>
      c.charCodeAt(0)
    );
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      encryptedBuffer
    );

    // Convert back to text
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Moderator decryption error:", error);
    throw new Error("Failed to decrypt message as moderator");
  }
};
