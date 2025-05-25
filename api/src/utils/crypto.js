import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Server-side cryptographic utilities for handling flagged messages - RSA only
 * This allows multiple moderators to decrypt flagged messages through server mediation
 */

/**
 * Encrypts data using the server's public key with chunked RSA encryption
 * @param {string} data - The data to encrypt
 * @returns {string} Base64 encoded encrypted data
 */
export const encryptWithServerKey = (data) => {
  try {
    const serverPublicKey = process.env.SERVER_PUBLIC_KEY;
    if (!serverPublicKey) {
      throw new Error('Server public key not found in environment variables');
    }

    // Convert the base64 public key to buffer and create key object
    const publicKeyBuffer = Buffer.from(serverPublicKey, 'base64');
    const publicKey = crypto.createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki',
    });

    // Calculate max chunk size for RSA-OAEP with SHA-256
    // RSA-OAEP with SHA-256 can encrypt at most (keySize - 2*hashSize - 2) bytes
    // For 2048-bit key with SHA-256: 2048/8 - 2*32 - 2 = 190 bytes
    const maxChunkSize = 190;
    const dataBuffer = Buffer.from(data, 'utf8');

    if (dataBuffer.length <= maxChunkSize) {
      // Data is small enough, encrypt directly
      const encryptedBuffer = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        dataBuffer,
      );
      return encryptedBuffer.toString('base64');
    } else {
      // Data is too large, need to chunk it
      const chunks = [];
      for (let i = 0; i < dataBuffer.length; i += maxChunkSize) {
        const chunk = dataBuffer.slice(i, i + maxChunkSize);
        const encryptedChunk = crypto.publicEncrypt(
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          chunk,
        );
        chunks.push(encryptedChunk.toString('base64'));
      }
      
      // Join chunks with a delimiter and encode the whole thing
      const joinedChunks = chunks.join('|CHUNK|');
      return Buffer.from(joinedChunks).toString('base64');
    }
  } catch (error) {
    console.error('Server encryption error:', error);
    throw new Error('Failed to encrypt with server key');
  }
};

/**
 * Decrypts data using the server's private key with chunked RSA decryption
 * @param {string} encryptedData - Base64 encoded encrypted data from encryptWithServerKey
 * @returns {string} Decrypted data
 */
export const decryptWithServerKey = (encryptedData) => {
  try {
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY;
    if (!serverPrivateKey) {
      throw new Error('Server private key not found in environment variables');
    }

    // Convert the base64 private key to buffer and create key object
    const privateKeyBuffer = Buffer.from(serverPrivateKey, 'base64');
    const privateKey = crypto.createPrivateKey({
      key: privateKeyBuffer,
      format: 'der',
      type: 'pkcs8',
    });

    // Check if this is chunked data
    try {
      const decodedData = Buffer.from(encryptedData, 'base64').toString('utf8');
      if (decodedData.includes('|CHUNK|')) {
        // Handle chunked format
        const chunks = decodedData.split('|CHUNK|');
        const decryptedChunks = chunks.map((chunk) => {
          const encryptedBuffer = Buffer.from(chunk, 'base64');
          const decryptedChunk = crypto.privateDecrypt(
            {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256',
            },
            encryptedBuffer,
          );
          return decryptedChunk.toString('utf8');
        });
        
        return decryptedChunks.join('');
      } else {
        // Handle single chunk format
        const encryptedBuffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          encryptedBuffer
        );
        return decrypted.toString('utf8');
      }
    } catch (decryptError) {
      throw new Error(`Failed to decrypt: ${decryptError.message}`);
    }
  } catch (error) {
    console.error('Server decryption error:', error);
    throw new Error('Failed to decrypt with server key');
  }
};

/**
 * Encrypts data with a moderator's public key using chunked RSA encryption
 * @param {string} data - The data to encrypt
 * @param {string} moderatorPublicKey - Base64 encoded moderator public key
 * @returns {string} Base64 encoded encrypted data
 */
export const encryptWithModeratorKey = (data, moderatorPublicKey) => {
  try {
    // Convert the base64 public key to buffer and create key object
    const publicKeyBuffer = Buffer.from(moderatorPublicKey, 'base64');
    const publicKey = crypto.createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki',
    });

    // Calculate max chunk size for RSA-OAEP with SHA-256
    const maxChunkSize = 190;
    const dataBuffer = Buffer.from(data, 'utf8');

    if (dataBuffer.length <= maxChunkSize) {
      // Data is small enough, encrypt directly
      const encryptedBuffer = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        dataBuffer
      );
      return encryptedBuffer.toString('base64');
    } else {
      // Data is too large, need to chunk it
      const chunks = [];
      for (let i = 0; i < dataBuffer.length; i += maxChunkSize) {
        const chunk = dataBuffer.slice(i, i + maxChunkSize);
        const encryptedChunk = crypto.publicEncrypt(
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          chunk,
        );
        chunks.push(encryptedChunk.toString('base64'));
      }
      
      // Join chunks with a delimiter and encode the whole thing
      const joinedChunks = chunks.join('|CHUNK|');
      return Buffer.from(joinedChunks).toString('base64');
    }
  } catch (error) {
    console.error('Moderator encryption error:', error);
    throw new Error('Failed to encrypt with moderator key');
  }
};

/**
 * Decrypts data with a moderator's private key using chunked RSA decryption
 * @param {string} encryptedData - Base64 encoded encrypted data from encryptWithModeratorKey
 * @param {string} moderatorPrivateKey - Base64 encoded moderator private key
 * @returns {string} Decrypted data
 */
export const decryptWithModeratorKey = (encryptedData, moderatorPrivateKey) => {
  try {
    // Convert the base64 private key to buffer and create key object
    const privateKeyBuffer = Buffer.from(moderatorPrivateKey, 'base64');
    const privateKey = crypto.createPrivateKey({
      key: privateKeyBuffer,
      format: 'der',
      type: 'pkcs8',
    });

    // Check if this is chunked data
    try {
      const decodedData = Buffer.from(encryptedData, 'base64').toString('utf8');
      if (decodedData.includes('|CHUNK|')) {
        // Handle chunked format
        const chunks = decodedData.split('|CHUNK|');
        let decryptedMessage = '';
        
        for (const chunk of chunks) {
          const encryptedBuffer = Buffer.from(chunk, 'base64');
          const decryptedChunk = crypto.privateDecrypt(
            {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256',
            },
            encryptedBuffer
          );
          decryptedMessage += decryptedChunk.toString('utf8');
        }
        
        return decryptedMessage;
      } else {
        // Handle single chunk format
        const encryptedBuffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          encryptedBuffer
        );
        return decrypted.toString('utf8');
      }
    } catch (decryptError) {
      throw new Error(`Failed to decrypt: ${decryptError.message}`);
    }
  } catch (error) {
    console.error('Moderator decryption error:', error);
    throw new Error('Failed to decrypt with moderator key');
  }
};

/**
 * Generates the server's RSA key pair
 * This should be run once to generate keys for environment variables
 * @returns {Object} Object containing base64 encoded public and private keys
 */
export const generateServerKeyPair = () => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      },
    });

    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64'),
    };
  } catch (error) {
    console.error('Key generation error:', error);
    throw new Error('Failed to generate server key pair');
  }
};

/**
 * Decrypts data using the server's private key - same as decryptWithServerKey
 * Maintained for backward compatibility but now only uses RSA
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} Decrypted data
 */
export const decryptWithServerKeyCompat = (encryptedData) => {
  return decryptWithServerKey(encryptedData);
}; 