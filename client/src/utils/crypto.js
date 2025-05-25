/**
 * Utility functions for cryptographic operations - RSA only
 */

/**
 * Checks if a private key exists in localStorage
 * @returns {boolean} True if private key exists, false otherwise
 */
export const hasPrivateKey = () => {
  const privateKey = localStorage.getItem("privateKey");
  return !!privateKey;
};

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
 * Encrypts a message using a recipient's public key with chunked RSA encryption
 * @param {string} message - The message to encrypt
 * @param {string} recipientPublicKeyBase64 - Recipient's public key in base64
 * @returns {Promise<string>} Encrypted message in base64
 */
export const encryptMessage = async (message, recipientPublicKeyBase64) => {
  try {
    console.log("Encrypting message with RSA, length:", message.length);

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

    // Calculate max chunk size for RSA-OAEP with SHA-256
    // RSA-OAEP with SHA-256 can encrypt at most (keySize - 2*hashSize - 2) bytes
    // For 2048-bit key with SHA-256: 2048/8 - 2*32 - 2 = 190 bytes
    const maxChunkSize = 190;
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    if (messageBuffer.length <= maxChunkSize) {
      // Message is small enough, encrypt directly
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        messageBuffer
      );
      const result = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      console.log("Direct RSA encryption complete, result length:", result.length);
      return result;
    } else {
      // Message is too large, need to chunk it
      console.log("Message too large, using chunked encryption");
      const chunks = [];
      for (let i = 0; i < messageBuffer.length; i += maxChunkSize) {
        const chunk = messageBuffer.slice(i, i + maxChunkSize);
        const encryptedChunk = await window.crypto.subtle.encrypt(
          { name: "RSA-OAEP" },
          publicKey,
          chunk
        );
        chunks.push(btoa(String.fromCharCode(...new Uint8Array(encryptedChunk))));
      }
      
      // Join chunks with a delimiter and encode the whole thing
      const joinedChunks = chunks.join('|CHUNK|');
      const result = btoa(joinedChunks);
      console.log("Chunked RSA encryption complete, result length:", result.length);
      return result;
    }
  } catch (error) {
    console.error("RSA encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypts a message using the user's private key with RSA-only decryption
 * @param {string} encryptedMessageBase64 - Encrypted message in base64
 * @returns {Promise<string>} Decrypted message
 */
export const decryptMessage = async (encryptedMessageBase64) => {
  try {
    console.log("Decrypting user message, length:", encryptedMessageBase64.length);
    
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

    // Decrypt using RSA
    const result = await decryptRSAMessage(encryptedMessageBase64, privateKey);
    console.log("RSA decryption successful for user message!");
    return result;
  } catch (error) {
    console.error("User message decryption error:", error);
    throw new Error("Failed to decrypt message");
  }
};

/**
 * Gets the server's public key for encrypting flagged messages
 * @returns {Promise<string>} Server's public key in base64
 */
export const getServerPublicKey = async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/crypto/serverPublicKey`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch server public key');
    }
    
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error fetching server public key:', error);
    throw new Error('Failed to get server public key');
  }
};

/**
 * Encrypts a message using the server's public key (for flagged messages)
 * Uses chunking to handle messages larger than RSA key size
 * @param {string} message - The message to encrypt
 * @returns {Promise<string>} Encrypted message in base64
 */
export const encryptForModerator = async (message) => {
  try {
<<<<<<< HEAD
    // Get server's public key
    const serverPublicKey = await getServerPublicKey();
=======
    // Hardcoded moderator public key
    const MODERATOR_PUBLIC_KEY =
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAygBxQjCZSkcZumZuTvwsIyLrKivZjnux09UWga3JYh90U+lrTDt5bxBoeUhtgRMpUpcnjR5f+92PZIX/ve1t8xRNSc3XGNIVOSuIaVTHUdHsXPCfLA8kLQ2JLID5yn+qx3r84JxUHsK1G9nKryCLH0gZAno98hm1F3OsYLXnYzcUYCV/wbrv96Ty9hy3ckmhpNesrmVBAfUjINBJbKN2lCKXvrrJJLCLn6RmnEzEEQzTVCQKfXgWFxKlVVEb31aQcrE7hFP2bkVB7mhHfN19HXlVEj61P1f5tgr2gGmALFle3xHegh8hXFEzEqXYtsBz1H5m2ZxPcCmunWqMM6F1xwIDAQAB";
>>>>>>> origin/main

    // Convert base64 public key back to CryptoKey
    const publicKeyBuffer = Uint8Array.from(atob(serverPublicKey), (c) =>
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

    // Calculate max chunk size for RSA-OAEP with SHA-256
    const maxChunkSize = 190;
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    if (messageBuffer.length <= maxChunkSize) {
      // Message is small enough, encrypt directly
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        messageBuffer
      );
      return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    } else {
      // Message is too large, need to chunk it
      const chunks = [];
      for (let i = 0; i < messageBuffer.length; i += maxChunkSize) {
        const chunk = messageBuffer.slice(i, i + maxChunkSize);
        const encryptedChunk = await window.crypto.subtle.encrypt(
          { name: "RSA-OAEP" },
          cryptoKey,
          chunk
        );
        chunks.push(btoa(String.fromCharCode(...new Uint8Array(encryptedChunk))));
      }
      
      // Join chunks with a delimiter and encode the whole thing
      const joinedChunks = chunks.join('|CHUNK|');
      return btoa(joinedChunks);
    }
  } catch (error) {
    console.error("Server encryption error:", error);
    throw new Error("Failed to encrypt message for server");
  }
};

/**
 * Decrypts a message using the moderator's private key with RSA-only decryption
 * @param {string} encryptedMessageBase64 - Encrypted message in base64
 * @returns {Promise<string>} Decrypted message
 */
export const decryptAsModerator = async (encryptedMessageBase64) => {
  try {
<<<<<<< HEAD
    console.log("Decrypting moderator message:", encryptedMessageBase64.substring(0, 100) + "...");
    
    // Get moderator's private key from localStorage
    const moderatorPrivateKey = localStorage.getItem("moderatorPrivateKey");
    if (!moderatorPrivateKey) {
=======
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
>>>>>>> origin/main
      throw new Error(
        "No moderator private key found. Please upload your private key first."
      );
    }

<<<<<<< HEAD
    // Convert base64 private key back to CryptoKey
    const privateKeyBuffer = Uint8Array.from(atob(moderatorPrivateKey), (c) =>
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

    // Decrypt using RSA
    const result = await decryptRSAMessage(encryptedMessageBase64, cryptoKey);
    console.log("RSA decryption successful for moderator!");
    return result;
=======
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
>>>>>>> origin/main
  } catch (error) {
    console.error("❌ [DEBUG] Overall decryption error:", error);
    throw new Error("Failed to decrypt message as moderator: " + error.message);
  }
};

/**
 * Decrypts an RSA-encrypted message (supports both single chunk and multi-chunk)
 * @param {string} encryptedMessageBase64 - Base64 encoded RSA encrypted message
 * @param {CryptoKey} privateKey - RSA private key for decryption
 * @returns {Promise<string>} Decrypted message
 */
const decryptRSAMessage = async (encryptedMessageBase64, privateKey) => {
  console.log("RSA decryption input length:", encryptedMessageBase64.length);
  
  try {
    // First try direct RSA decryption (most common case)
    try {
      console.log("Trying direct RSA decryption...");
      const encryptedBuffer = Uint8Array.from(atob(encryptedMessageBase64), c => c.charCodeAt(0));
      console.log("Encrypted buffer length:", encryptedBuffer.length);
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      const result = decoder.decode(decryptedBuffer);
      console.log("Direct RSA decryption successful, result length:", result.length);
      return result;
    } catch (directError) {
      console.log("Direct RSA decryption failed:", directError.message);
      
      // Try chunked decryption
      const possibleChunked = atob(encryptedMessageBase64);
      if (possibleChunked.includes('|CHUNK|')) {
        console.log("Trying chunked RSA decryption...");
        const chunks = possibleChunked.split('|CHUNK|');
        console.log("Found chunks:", chunks.length);
        
        const decryptedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`Decrypting chunk ${i + 1}/${chunks.length}, length: ${chunk.length}`);
          
          const encryptedBuffer = Uint8Array.from(atob(chunk), c => c.charCodeAt(0));
          const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedBuffer
          );
          decryptedChunks.push(new Uint8Array(decryptedBuffer));
        }
        
        // Combine all chunks
        const totalLength = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of decryptedChunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        const decoder = new TextDecoder();
        const result = decoder.decode(combined);
        console.log("Chunked RSA decryption successful, result length:", result.length);
        return result;
      } else {
        // Re-throw the direct decryption error since chunking isn't applicable
        throw directError;
      }
    }
  } catch (error) {
    console.error("RSA decryption failed:", error);
    throw error;
  }
};
