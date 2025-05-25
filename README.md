# WhisperChain+: Anonymous Messaging with Role-Based Control and Accountability

by Cameron Keith and Jacob Zhang

### COSC 55: Security and Privacy Lab 2



## Project Overview

WhisperChain+ is a secure, anonymous messaging platform designed for learning communities where users can send encrypted compliments and encouragement while maintaining strict privacy and accountability standards. The system implements role-based access control (RBAC), comprehensive audit logging, and advanced cryptographic security measures.

### Core Mission

Build a role-based anonymous messaging platform that:
- Allows users to send anonymous, encrypted compliments
- Enforces strict role-based permissions for sending, receiving, flagging, and auditing
- Supports logging and moderation without breaking anonymity
- Prevents spam, message flooding, and identity abuse
- Maintains privacy while offering traceability and accountability

## System Roles

| Role | Capabilities |
|------|-------------|
| **User (Sender/Recipient)** | Send encrypted anonymous messages, receive and decrypt messages, flag inappropriate content |
| **Moderator** | View flagged messages, review audit logs, suspend users, freeze abusive tokens |
| **Admin** | User management, role assignment, system statistics, audit log access (no message content access) |
| **Idle** | Suspended or pending approval users |

## Technical Architecture

### Tech Stack
- **Frontend**: React + Vite, Material-UI, Zustand state management
- **Backend**: Node.js + Express, Babel transpilation
- **Database**: MongoDB with Mongoose ODM
- **Encryption**: Web Crypto API (frontend), Node.js crypto (backend)
- **Authentication**: JWT tokens with role-based middleware

### Security Features
- **End-to-end encryption** using RSA-OAEP with 2048-bit keys
- **Anonymous token system** with unlinkable message attribution
- **Chunked encryption** for messages larger than 190 bytes
- **Server-mediated moderation** with encrypted flagged content
- **Tamper-proof audit logging** with append-only design
- **Separation of duties** preventing admins from accessing message content

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd whisperchain/api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the `api` directory:
```env
PORT=9090
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whisperchain
JWT_SECRET=your-jwt-secret-key
SERVER_PUBLIC_KEY=base64-encoded-server-public-key
SERVER_PRIVATE_KEY=base64-encoded-server-private-key
```

4. **Generate Server Keys**
```bash
npm run generate-keys
```

5. **Start the server**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to client directory**
```bash
cd ../client
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:9090/api
```

4. **Start the development server**
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - New user registration
- `GET /api/auth/profile` - User profile information
- `POST /api/auth/generateKeyPair` - RSA key pair generation

### Messaging (User Role)
- `POST /api/messages` - Send encrypted message
- `GET /api/messages` - Retrieve received messages
- `GET /api/messages/sent` - View sent message history
- `POST /api/messages/flag` - Flag/unflag inappropriate messages

### Moderation (Moderator Role)
- `GET /api/moderator/flaggedMessages` - View flagged message queue
- `POST /api/moderator/moderate` - Take moderation action
- `GET /api/moderator/auditLogs` - Access audit logs
- `POST /api/moderator/public-key` - Set moderator public key
- `GET /api/moderator/flagged/count` - Get flagged message count

### Administration (Admin Role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/pendingUsers` - View pending user approvals
- `POST /api/admin/assignRole` - Assign user roles
- `GET /api/admin/stats` - System statistics

## Usage Guide

### For Users
1. **Registration**: Sign up with email and request a role
2. **Key Generation**: Generate RSA key pair for encryption
3. **Send Messages**: Compose encrypted anonymous messages to other users
4. **Receive Messages**: Decrypt and read messages in your inbox
5. **Flag Content**: Report inappropriate messages to moderators

### For Moderators
1. **Setup**: Upload private key for decrypting flagged content
2. **Review Flags**: Examine flagged messages in the moderation queue
3. **Take Action**: Suspend users or freeze tokens for policy violations
4. **Audit Access**: Review system audit logs for security monitoring

### For Admins
1. **User Management**: Approve pending registrations and assign roles
2. **System Oversight**: Monitor system statistics and health
3. **Audit Review**: Access comprehensive audit logs
4. **Role Assignment**: Manage user permissions and access levels

## Project Structure

```
whisperchain/
├── api/                          # Backend server
│   ├── src/
│   │   ├── controllers/          # API endpoint handlers
│   │   ├── models/              # Database schemas
│   │   ├── middleware/          # Authentication & authorization
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Cryptographic utilities
│   │   └── server.js           # Application entry point
│   ├── package.json
│   └── .env
├── client/                       # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── utils/               # Client-side crypto utilities
│   │   ├── store/              # State management
│   │   └── App.jsx             # Main application component
│   ├── package.json
│   └── .env
└── README.md
```

## Security Implementation

### Encryption Details
- **Algorithm**: RSA-OAEP with SHA-256
- **Key Size**: 2048-bit RSA keys
- **Chunking**: Automatic splitting for messages >190 bytes
- **Format**: PKCS#8 (private), SPKI (public), Base64 encoding

### Anonymous Token System
- **Format**: `msg_${timestamp}_${nanoid(10)}`
- **Properties**: One-time use, unlinkable to user identity
- **Lookup**: Sender identity only accessible through database token mapping

### Audit Logging
- **Actions Tracked**: User creation, role changes, message sending, flagging, moderation
- **Tamper Protection**: Append-only design, modification prevention
- **Privacy Preservation**: No sender identity logging, only role-level metadata

## Advanced Features

### Implemented Extensions
- **Unlinkable Token System**: Anonymous message attribution without identity exposure
- **Server-Mediated Encryption**: Secure moderator access to flagged content
- **Role-Based UI Adaptation**: Interface changes based on user permissions
- **Comprehensive Audit Trail**: Detailed logging while preserving anonymity
- **Intrusion Detection**: Monitoring for suspicious patterns and abuse

### Security Measures
- **Admin Compromise Protection**: Separation of duties, content access restrictions
- **Token Abuse Prevention**: Freezing capability, usage tracking
- **Message Privacy**: End-to-end encryption, no plaintext storage
- **Audit Integrity**: Tamper-proof logging, append-only design

## Testing

### Security Validation
- Role enforcement on all endpoints
- Encryption/decryption roundtrip testing
- Token unlinkability verification
- Audit log tamper resistance

### Functional Testing
- Complete message workflow (send/receive/decrypt)
- Flagging and moderation process
- User management and role assignment
- Cross-platform encryption compatibility

## Performance Characteristics

Based on production logs:
- Health checks: ~0.5ms average response time
- Message operations: ~85ms average
- Flagged message queries: ~80ms average
- Authentication: ~200ms average
- Database operations: Optimized with proper indexing

## Threat Model

### Identified Threats & Mitigations

1. **Admin Compromise**
   - **Mitigation**: Separation of duties, admins cannot access message content
   - **Audit**: All admin actions logged with timestamps

2. **Token Sharing/Abuse**
   - **Mitigation**: One-time use tokens, freezing capability
   - **Detection**: Monitoring for suspicious usage patterns

3. **Message Privacy Breach**
   - **Mitigation**: End-to-end encryption, no server-side plaintext storage
   - **Access Control**: Only intended recipients can decrypt messages

4. **Audit Log Tampering**
   - **Mitigation**: Append-only design, modification prevention
   - **Integrity**: Database-level constraints preventing alterations

## System Analysis

### Pros

#### Security Strengths
- **Strong Encryption**: RSA-OAEP with 2048-bit keys provides robust protection
- **Anonymous Messaging**: Unlinkable tokens preserve sender privacy
- **Role-Based Security**: Strict RBAC prevents unauthorized access
- **Audit Trail**: Comprehensive logging for accountability and forensics
- **Separation of Duties**: Admins cannot access message content
- **Tamper-Proof Logs**: Append-only design prevents log modification
- **End-to-End Encryption**: No server-side plaintext storage
- **Comprehensive Logging**: audit logs for accountability
- **One-time Verification Codes**: only verified email addresses can access their account
- **Rate Limiting**: wrong password lockout prevent brute force attacks

#### Usability Features
- **Intuitive Interface**: Role-based UI adapts to user permissions
- **Automatic Key Management**: Transparent encryption/decryption for users
- **Responsive Design**: Works across desktop and mobile platforms
- **Real-time Updates**: Live status indicators and notifications
- **Moderation Tools**: Efficient flagging and review workflow

#### Technical Benefits
- **Scalable Architecture**: Stateless API design supports horizontal scaling
- **Modern Tech Stack**: React, Node.js, MongoDB for maintainability
- **Cross-Platform Compatibility**: Web Crypto API and Node.js crypto interoperability
- **Production Ready**: Comprehensive error handling and logging
- **Performance Optimized**: Sub-100ms response times for most operations

### Cons

#### Technical Limitations
- **RSA Performance**: Slower than symmetric encryption, especially for large messages
- **Storage Overhead**: Chunked encryption increases message size by ~35%
- **Key Management Complexity**: Users must manage and backup private keys
- **Browser Dependency**: Web Crypto API requires modern browser support
- **Single Point of Failure**: Centralized server architecture

#### Usability Challenges
- **Key Recovery**: No built-in mechanism for users' lost private keys
- **Password Management**: No current implementation to reset passwords

#### Operational Concerns
- **Abuse Potential**: Anonymous nature can be exploited for harassment
- **One-time Tokens**: reduce convenience because you have to verify the 6-digit code every time you login

### Known Vulnerabilities

#### Cryptographic Risks
- **Quantum Threat**: RSA-2048 vulnerable to future quantum computers (Shor's algorithm)
- **Key Compromise**: If private keys are stolen and your password and email are compromised, all received messages are vulnerable

#### System Architecture Vulnerabilities
- **Database Injection**: MongoDB queries could be vulnerable to NoSQL injection
- **JWT Weaknesses**: Token theft or replay attacks possible
- **Session Management**: Concurrent sessions not properly managed
- **Memory Leaks**: Cryptographic operations may leave sensitive data in memory

#### Operational Security Issues
- **Admin Privilege Escalation**: Database access could allow role manipulation

#### Social Engineering Risks
- **Phishing Attacks**: Users could be tricked into revealing private keys
- **Social Pressure**: Coercion to reveal anonymous message senders
- **Moderator Compromise**: Malicious moderators could abuse flagged content access
- **False Flag Operations**: Malicious users could frame others for violations
- **Trust Exploitation**: Users may overshare believing in system anonymity

### Mitigation Strategies

#### Immediate Improvements
- **Rate Limiting**: Implement API rate limiting to prevent DoS attacks
- **Key Rotation**: Add support for periodic key rotation
- **Input Validation**: Strengthen all user input validation and sanitization
- **Session Security**: Implement proper session management and timeouts
- **Memory Protection**: Clear sensitive data from memory after use

#### Long-term Enhancements
- **Post-Quantum Cryptography**: Migrate to lattice-based or other quantum-resistant algorithms
- **Multi-Factor Authentication**: Add support for multi-factor authentication
- **Encryption Strength**: Upgrade to stronger encryption 

#### Operational Security
- **Monitoring Enhancement**: Implement advanced threat detection and response

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with appropriate tests
4. Ensure security requirements are met
5. Submit a pull request with detailed description

## License

This project is developed for educational purposes as part of a cybersecurity course. All code should be used responsibly and in accordance with applicable laws and regulations.

## Support

For technical issues or questions about the system:
1. Check the audit logs for system events
2. Review the API documentation for endpoint usage
3. Examine server logs for operational issues
4. Consult the security documentation for threat mitigation

---
