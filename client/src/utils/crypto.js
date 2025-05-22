/**
 * Utility functions for cryptographic operations
 */

// Hardcoded moderator key pair for now
// In production, this would be securely managed and stored
export const MODERATOR_PUBLIC_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuuDrKMzBJtU3GBEwGqKbENYwqx5a1qhzZ5xvL5EbEuZKUg9cXKIw4Q1RxO3EvqOCJpZAC3t1I7PCSYXRuk9vYpnfdxTzYwIhAMO++KNGv8kV3D5IxNAl8hHBS/OUxyrXWh+JIE80nCeJxQAs7S9IqbJrvEPpYXG8RcjfGXSS5bDj4g6LWPBlwKAA8KnnDYN5Zkb2xuxvQhRlceITsvXHoQr1KwFfk8Z7RwKbDG8rXkQB3KjVD8G+1aFAsgwLx/+YngxEy1C89WjMwKsSi4vO5FVDtpn/1fFyQBvLc+0F4WECzoMfxr0hBiGZOYXu5qgfnjp9lyGwHwPpZTLQ3sTW9QIDAQAB";
export const MODERATOR_PRIVATE_KEY =
  "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC64OsozMEm1TcYETAaopsQ1jCrHlrWqHNnnG8vkRsS5kpSD1xcojDhDVHE7cS+o4ImlkALe3Ujs8JJhdG6T29imd93FPNjAiEAw774o0a/yRXcPkjE0CXyEcFL85THKtdaH4kgTzScJ4nFACztr0ipsmK8Q+lhcbxFyN8ZdJLlsOPiDotY8GXAoADwqecNg3lmRvbG7G9CFGVx4hOy9cehCvUrAV+TxntHApsYbyteRAHcqNUPwb7VoUCyDAvH/5ieDETLULz1aMzAqxKLi87kVUO2mf/V8XJAG8tz7QXhYQLOgx/GvSEGIZk5he7mqB+eOn2XIbAfA+llMtDexNb1AgMBAAECggEAEbdEARCH4wYQPqrHXUQ5jUXrDZ2XuQQYNZGQAXH1fKHfXRljBVY87JD0fOl9gVRzzhxkHVbmYoJCR5aZUcvHQkI3X3phaRBpMlxRFrMJGSgvE6y58MCT7HjHYlZa/Xf0EnJuZ2CKYUlNZvfsg6LV65CDaNKdiPDJZWuESHpgF9pep61jLGc2QBbzuRXxKPfuqP2JmxQPQpKokUEFZp2OJBwQRNd+WhTHh5mSK5J7dQ+HgQGT15YX75KnRsekHvRKhLBdAexZaKnGZ5vH8fZ3F75y/lHkMikvpuSS1pWbNLmCe7fQTrfFjUfvgl78qiZg+lK5R0QgzhFkPD3lU2QKAQKBgQDrcIZeZdI9iIYbq6OhSPKvoqmJGZLlIAJGTG5UIRk1aCnFaYePIX4t6ZcoATlbrWGKZ7eFCNYvUoC300JKpOO+NZWgvfXL8Cyxi5ZNy38GbHr5D0gDVKepKHA/UraGkIBLxVE9HgpcR3YWlTXPyDV1F7S3MQl4kKbKGt0u3bOcNQKBgQDLTG4p8XxdK5VBfddnw0RCzAGaCTFEwYEDIBqa+tqPBYjS5KPIpvFV2qPuPPQE5nHQGaNhN9hT77YGgBOFpFOC0QePBAdkgDx7cHS3UcnDQheyTRmjkSyFUYY1OxMPL4V8GW+nWcLXEzdvd8aGE6z40dXBh2jP7iZIV+S/qrP+wQKBgQCF6XKEZZ0Jyw67O1xbI6Dw5qkVoE7E3yYnkS+BZvZwA2Bv4UmIPpuQRFDGlHwVwxouNhYRi6Mkj4t3KNCQOGgsiqcDnrhIAN9hVUaJWKQmQwzS9KO8y6vB5pGn+dJPNTlPtVvpTiD0gwGT1jDR23TQh04OXQLWKTTCzNUFaFPO8QKBgAOg5xBKMJnCmXObPYzc2RVnc+DSJLIQvqwDYXHOrhZhjRImUJ4iLDYOGZbTibQJLfcVpVLdlnU7WdYr9mT0XKEn4FoXHb8J0LPm5cRSbLw8BYjYLxTtjwZi6lScY/MjJUiWwDQDgRe58sBfsuHLjCWtTnYbPHnuQrVCQVJcVswBAoGAFFp91YRF/nWRAiWLAXIqLOIpVRuLPS1zL2cX4HukfHh5nsQvF0juR5Im5BTrgGpj9NrIcM03XiHmGLsjONgCDY7uKUMA49SQDGk9LO4v3ymEPZQ3TWzYC7cXQmVeG0hJ9jncHTj2WLjgtdtNP5F8YY2ob7n+JzJP5KBK8OXqRLY=";

/**
 * Generates an RSA key pair for secure messaging and stores the private key
 * @returns {Promise<{publicKey: string}>} The generated public key in base64 format
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

    // Export public key to base64 format for server storage
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const publicKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(publicKeyBuffer))
    );

    // Export and store private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const privateKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(privateKeyBuffer))
    );

    // Store private key in localStorage
    localStorage.setItem("privateKey", privateKeyBase64);

    return {
      publicKey: publicKeyBase64,
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
 * Decrypts a message using the moderator private key
 * @param {string} encryptedMessageBase64 - Encrypted message in base64
 * @returns {Promise<string>} Decrypted message
 */
export const decryptMessageAsModerator = async (encryptedMessageBase64) => {
  try {
    // Use the hardcoded moderator private key
    const privateKeyBase64 = MODERATOR_PRIVATE_KEY;

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
    console.error("Moderator decryption error:", error);
    throw new Error("Failed to decrypt message as moderator");
  }
};
