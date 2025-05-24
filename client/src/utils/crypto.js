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
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAygBxQjCZSkcZumZuTvwsIyLrKivZjnux09UWga3JYh90U+lrTDt5bxBoeUhtgRMpUpcnjR5f+92PZIX/ve1t8xRNSc3XGNIVOSuIaVTHUdHsXPCfLA8kLQ2JLID5yn+qx3r84JxUHsK1G9nKryCLH0gZAno98hm1F3OsYLXnYzcUYCV/wbrv96Ty9hy3ckmhpNesrmVBAfUjINBJbKN2lCKXvrrJJLCLn6RmnEzEEQzTVCQKfXgWFxKlVVEb31aQcrE7hFP2bkVB7mhHfN19HXlVEj61P1f5tgr2gGmALFle3xHegh8hXFEzEqXYtsBz1H5m2ZxPcCmunWqMM6F1xwIDAQAB";

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
    console.log("🔍 [DEBUG] Starting moderator decryption process");
    console.log(
      "🔍 [DEBUG] Encrypted message length:",
      encryptedMessageBase64?.length
    );

    // Get moderator's private key from localStorage
    const storedKeyPair = localStorage.getItem("moderatorKeyPair");
    console.log("🔍 [DEBUG] Stored key pair found:", !!storedKeyPair);

    if (!storedKeyPair) {
      console.error("❌ [DEBUG] No moderator key pair found in localStorage");
      throw new Error(
        "No moderator key pair found. Please generate one first."
      );
    }

    let parsedKeyPair;
    try {
      parsedKeyPair = JSON.parse(storedKeyPair);
      console.log("🔍 [DEBUG] Key pair parsed successfully");
      console.log("🔍 [DEBUG] Has publicKey:", !!parsedKeyPair.publicKey);
      console.log("🔍 [DEBUG] Has privateKey:", !!parsedKeyPair.privateKey);
      console.log(
        "🔍 [DEBUG] Private key length:",
        parsedKeyPair.privateKey?.length
      );
    } catch (parseError) {
      console.error("❌ [DEBUG] Failed to parse stored key pair:", parseError);
      throw new Error("Invalid stored key pair format");
    }

    const { privateKey, publicKey: uploadedPublicKey } = parsedKeyPair;

    // Compare uploaded public key with hardcoded one
    const HARDCODED_MODERATOR_PUBLIC_KEY =
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAygBxQjCZSkcZumZuTvwsIyLrKivZjnux09UWga3JYh90U+lrTDt5bxBoeUhtgRMpUpcnjR5f+92PZIX/ve1t8xRNSc3XGNIVOSuIaVTHUdHsXPCfLA8kLQ2JLID5yn+qx3r84JxUHsK1G9nKryCLH0gZAno98hm1F3OsYLXnYzcUYCV/wbrv96Ty9hy3ckmhpNesrmVBAfUjINBJbKN2lCKXvrrJJLCLn6RmnEzEEQzTVCQKfXgWFxKlVVEb31aQcrE7hFP2bkVB7mhHfN19HXlVEj61P1f5tgr2gGmALFle3xHegh8hXFEzEqXYtsBz1H5m2ZxPcCmunWqMM6F1xwIDAQAB";

    console.log(
      "🔍 [DEBUG] Hardcoded public key:",
      HARDCODED_MODERATOR_PUBLIC_KEY.substring(0, 50) + "..."
    );
    console.log(
      "🔍 [DEBUG] Uploaded public key:",
      uploadedPublicKey?.substring(0, 50) + "..."
    );
    console.log(
      "🔍 [DEBUG] Public keys match:",
      HARDCODED_MODERATOR_PUBLIC_KEY === uploadedPublicKey
    );

    if (!privateKey) {
      console.error("❌ [DEBUG] No private key found in parsed key pair");
      throw new Error("No private key found in stored key pair");
    }

    console.log(
      "🔍 [DEBUG] Private key first 50 chars:",
      privateKey.substring(0, 50)
    );

    // Convert base64 private key back to CryptoKey
    let privateKeyBuffer;
    try {
      privateKeyBuffer = Uint8Array.from(atob(privateKey), (c) =>
        c.charCodeAt(0)
      );
      console.log(
        "🔍 [DEBUG] Private key buffer created, length:",
        privateKeyBuffer.length
      );
    } catch (atobError) {
      console.error(
        "❌ [DEBUG] Failed to decode base64 private key:",
        atobError
      );
      throw new Error("Invalid base64 private key format");
    }

    let cryptoKey;
    try {
      cryptoKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["decrypt"]
      );
      console.log("✅ [DEBUG] Private key imported successfully");
    } catch (importError) {
      console.error("❌ [DEBUG] Failed to import private key:", importError);
      throw new Error("Failed to import private key: " + importError.message);
    }

    // Decrypt the message
    let encryptedBuffer;
    try {
      encryptedBuffer = Uint8Array.from(atob(encryptedMessageBase64), (c) =>
        c.charCodeAt(0)
      );
      console.log(
        "🔍 [DEBUG] Encrypted buffer created, length:",
        encryptedBuffer.length
      );
    } catch (encryptedAtobError) {
      console.error(
        "❌ [DEBUG] Failed to decode encrypted message:",
        encryptedAtobError
      );
      throw new Error("Invalid encrypted message format");
    }

    let decryptedBuffer;
    try {
      console.log("🔍 [DEBUG] Attempting decryption...");
      decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encryptedBuffer
      );
      console.log(
        "✅ [DEBUG] Decryption successful, buffer length:",
        decryptedBuffer.byteLength
      );
    } catch (decryptError) {
      console.error("❌ [DEBUG] Decryption failed:", decryptError);
      console.error("❌ [DEBUG] Decryption error details:", {
        name: decryptError.name,
        message: decryptError.message,
        code: decryptError.code,
      });

      // Check if this is a key mismatch issue
      if (HARDCODED_MODERATOR_PUBLIC_KEY !== uploadedPublicKey) {
        console.error(
          "❌ [DEBUG] Key mismatch detected! The flagged message was encrypted with a different public key."
        );
        throw new Error(
          "Key mismatch: This message was encrypted with a different moderator public key. The message may be from before your key was updated."
        );
      }

      throw new Error(
        "Decryption failed - key mismatch or corrupted data: " +
          decryptError.message
      );
    }

    // Convert back to text
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    console.log(
      "✅ [DEBUG] Final decrypted text length:",
      decryptedText.length
    );
    console.log(
      "🔍 [DEBUG] Decrypted text preview:",
      decryptedText.substring(0, 100)
    );

    return decryptedText;
  } catch (error) {
    console.error("❌ [DEBUG] Overall decryption error:", error);
    throw new Error("Failed to decrypt message as moderator: " + error.message);
  }
};
