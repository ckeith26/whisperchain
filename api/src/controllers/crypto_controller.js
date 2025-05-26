import dotenv from 'dotenv';

dotenv.config();

/**
 * Controller for cryptographic operations and key management
 */

/**
 * Get the server's public key for encrypting flagged messages
 * This allows clients to encrypt messages that can be decrypted by the server
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getServerPublicKey = async (req, res) => {
  try {
    const serverPublicKey = process.env.SERVER_PUBLIC_KEY;
    
    if (!serverPublicKey) {
      return res.status(500).json({ 
        error: 'Server public key not configured. Please contact administrator.' 
      });
    }

    return res.json({
      success: true,
      publicKey: serverPublicKey,
    });
  } catch (error) {
    console.error('Error getting server public key:', error.message);
    return res.status(500).json({ error: error.message });
  }
}; 