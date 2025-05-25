/**
 * Utility functions for cryptographic operations
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
    console.log("Encrypting message with chunked RSA, length:", message.length);

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
    console.error("Chunked RSA encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypts a message using the user's private key
 * Handles both hybrid encryption (AES + RSA) and legacy RSA-only formats
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

    // Check if the message looks like hybrid format by checking for colons after base64 decode
    let isHybridFormat = false;
    try {
      const decoded = atob(encryptedMessageBase64);
      const parts = decoded.split(':');
      isHybridFormat = parts.length === 3;
      console.log("User message format analysis:", { isHybridFormat, partsCount: parts.length });
    } catch (e) {
      console.log("Could not decode base64 for format check");
    }

    // First, try to decrypt as hybrid format (new system)
    if (isHybridFormat) {
      try {
        console.log("Attempting hybrid decryption for user message...");
        const result = await decryptHybridUserMessage(encryptedMessageBase64, privateKey);
        console.log("Hybrid decryption successful for user message!");
        return result;
      } catch (hybridError) {
        console.log("Hybrid decryption failed for user message:", hybridError.message);
      }
    }

    // Fall back to legacy RSA decryption
    try {
      console.log("Attempting legacy RSA decryption for user message...");
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
      const result = decoder.decode(decryptedBuffer);
      console.log("Legacy RSA decryption successful for user message!");
      return result;
    } catch (legacyError) {
      console.error("Both hybrid and legacy decryption failed for user message:", legacyError.message);
      throw new Error("Failed to decrypt message with any available method");
    }
  } catch (error) {
    console.error("User message decryption error:", error);
    throw new Error("Failed to decrypt message");
  }
};

/**
 * Decrypts a hybrid encrypted user message (AES + RSA format)
 * @param {string} encryptedMessageBase64 - Base64 encoded hybrid encrypted message
 * @param {CryptoKey} privateKey - RSA private key for decryption
 * @returns {Promise<string>} Decrypted message
 */
const decryptHybridUserMessage = async (encryptedMessageBase64, privateKey) => {
  console.log("Hybrid user message decryption starting...");
  
  // Decode the base64 message
  const hybridMessage = atob(encryptedMessageBase64);
  
  // Parse the hybrid format: encryptedAESKey:iv:encryptedData
  const parts = hybridMessage.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid hybrid message format - expected 3 parts, got ${parts.length}`);
  }

  const [encryptedAESKeyBase64, ivBase64, encryptedDataBase64] = parts;

  try {
    // Decrypt the AES key using RSA
    const encryptedAESKeyBuffer = Uint8Array.from(atob(encryptedAESKeyBase64), c => c.charCodeAt(0));
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAESKeyBuffer
    );

    // Import the AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuffer,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    // Decrypt the data using AES
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedDataBase64), c => c.charCodeAt(0));
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aesKey,
      encryptedData
    );

    // Convert back to text
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Hybrid user message decryption step failed:", error);
    throw error;
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
    // Get server's public key instead of using hardcoded moderator key
    const serverPublicKey = await getServerPublicKey();

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
    // RSA-OAEP with SHA-256 can encrypt at most (keySize - 2*hashSize - 2) bytes
    // For 2048-bit key with SHA-256: 2048/8 - 2*32 - 2 = 190 bytes
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
 * Decrypts a message using the moderator's private key
 * Handles both hybrid encryption (AES + RSA) and legacy RSA-only formats
 * @param {string} encryptedMessageBase64 - Encrypted message in base64
 * @returns {Promise<string>} Decrypted message
 */
export const decryptAsModerator = async (encryptedMessageBase64) => {
  try {
    console.log("Decrypting moderator message:", encryptedMessageBase64.substring(0, 100) + "...");
    
    // Get moderator's private key from localStorage (like user approach)
    const moderatorPrivateKey = localStorage.getItem("moderatorPrivateKey");
    if (!moderatorPrivateKey) {
      throw new Error(
        "No moderator private key found. Please upload your private key first."
      );
    }

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

    // Check if the message looks like hybrid format by checking for colons after base64 decode
    let isHybridFormat = false;
    try {
      const decoded = atob(encryptedMessageBase64);
      const parts = decoded.split(':');
      isHybridFormat = parts.length === 3;
      console.log("Message format analysis:", { isHybridFormat, partsCount: parts.length });
    } catch (e) {
      console.log("Could not decode base64 for format check");
    }

    // First, try to decrypt as hybrid format (new system)
    if (isHybridFormat) {
      try {
        console.log("Attempting hybrid decryption...");
        const result = await decryptHybridMessage(encryptedMessageBase64, cryptoKey);
        console.log("Hybrid decryption successful!");
        return result;
      } catch (hybridError) {
        console.log("Hybrid decryption failed:", hybridError.message);
      }
    }
    
    // Fall back to legacy RSA decryption
    try {
      console.log("Attempting legacy RSA decryption...");
      const result = await decryptLegacyRSAMessage(encryptedMessageBase64, cryptoKey);
      console.log("Legacy RSA decryption successful!");
      return result;
    } catch (legacyError) {
      console.error("Legacy RSA decryption failed:", legacyError.message);
      throw new Error("Failed to decrypt message with any available method");
    }
  } catch (error) {
    console.error("Moderator decryption error:", error);
    throw new Error("Failed to decrypt message as moderator");
  }
};

/**
 * Decrypts a hybrid encrypted message (AES + RSA format)
 * @param {string} encryptedMessageBase64 - Base64 encoded hybrid encrypted message
 * @param {CryptoKey} privateKey - RSA private key for decryption
 * @returns {Promise<string>} Decrypted message
 */
const decryptHybridMessage = async (encryptedMessageBase64, privateKey) => {
  console.log("Hybrid decryption starting...");
  
  // Decode the base64 message
  const hybridMessage = atob(encryptedMessageBase64);
  console.log("Decoded hybrid message length:", hybridMessage.length);
  
  // Parse the hybrid format: encryptedAESKey:iv:encryptedData
  const parts = hybridMessage.split(':');
  console.log("Hybrid message parts:", parts.length);
  
  if (parts.length !== 3) {
    throw new Error(`Invalid hybrid message format - expected 3 parts, got ${parts.length}`);
  }

  const [encryptedAESKeyBase64, ivBase64, encryptedDataBase64] = parts;
  console.log("Parts lengths:", {
    aesKey: encryptedAESKeyBase64.length,
    iv: ivBase64.length, 
    data: encryptedDataBase64.length
  });

  try {
    // Decrypt the AES key using RSA
    const encryptedAESKeyBuffer = Uint8Array.from(atob(encryptedAESKeyBase64), c => c.charCodeAt(0));
    console.log("Encrypted AES key buffer length:", encryptedAESKeyBuffer.length);
    
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAESKeyBuffer
    );
    console.log("Decrypted AES key length:", aesKeyBuffer.byteLength);

    // Import the AES key (256-bit key for AES-256-CBC)
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuffer,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
    console.log("AES key imported successfully");

    // Decrypt the data using AES
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedDataBase64), c => c.charCodeAt(0));
    
    console.log("AES decryption params:", {
      ivLength: iv.length,
      dataLength: encryptedData.length
    });
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aesKey,
      encryptedData
    );
    console.log("AES decryption successful, buffer length:", decryptedBuffer.byteLength);

    // Convert back to text
    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedBuffer);
    console.log("Final decrypted text length:", result.length);
    return result;
  } catch (error) {
    console.error("Hybrid decryption step failed:", error);
    throw error;
  }
};

/**
 * Decrypts a legacy RSA-only encrypted message
 * @param {string} encryptedMessageBase64 - Base64 encoded RSA encrypted message
 * @param {CryptoKey} privateKey - RSA private key for decryption
 * @returns {Promise<string>} Decrypted message
 */
const decryptLegacyRSAMessage = async (encryptedMessageBase64, privateKey) => {
  console.log("Legacy RSA decryption input length:", encryptedMessageBase64.length);
  
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
    console.error("All legacy RSA decryption methods failed:", error);
    throw error;
  }
};
