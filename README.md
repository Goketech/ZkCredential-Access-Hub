# ZK Credential Access Hub

A privacy-preserving credential management system built on **Midnight Blockchain**, enabling users to own, manage, and selectively disclose credentials using zero-knowledge proofs.

## 🌟 Features

### Core Functionality
- **Credential Issuance**: Issue digital credentials with encrypted commitments via Midnight smart contracts
- **Zero-Knowledge Proofs**: Generate proofs without revealing sensitive data using Midnight's ZK SDK
- **Selective Disclosure**: Choose exactly what information to reveal to verifiers
- **Privacy-First Design**: Built on Midnight's programmable privacy infrastructure
- **Wallet Integration**: Support for Midnight, MetaMask, and other Web3 wallets

### Midnight Blockchain Integration
- **Smart Contracts**: Compiled Midnight Compact contracts for credential registry and proof verification
- **ZK Verification**: Real zero-knowledge proof verification using Midnight's verification system
- **Contract Integration**: Backend seamlessly integrates with deployed Midnight contracts
- **Privacy Guarantees**: Leverages Midnight's shielded data handling and proof verification

### Enhanced UI/UX
- **Professional Landing Page**: Modern, responsive design with clear value proposition
- **Intuitive App Interface**: Clean, user-friendly credential management dashboard
- **Real-time Validation**: Form validation with helpful error messages
- **Demo Data Generation**: Easy testing with auto-generated commitment hashes
- **Responsive Design**: Works seamlessly across all device sizes

### Backend Improvements
- **Enhanced API**: Better error handling and validation
- **Credential Templates**: Predefined credential types (KYC, StudentID, License, etc.)
- **Verification History**: Track all proof verifications with audit trails
- **Statistics Dashboard**: System-wide credential and verification stats
- **Input Validation**: Comprehensive validation for addresses and commitment hashes
- **Environment Configuration**: Configurable via environment variables

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A Web3 wallet (MetaMask, Midnight Wallet, etc.)
- Midnight Compact compiler (for contract development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Goketech/ZkCredential-Access-Hub.git
cd ZkCredential-Access-Hub
```

2. **Install dependencies**
```bash
# Install all dependencies
npm run install:all

# Or install individually
cd src/backend && npm install
cd ../frontend && npm install
```

3. **Set up environment variables**
```bash
# Copy environment templates
cp env.example .env
cp src/frontend/env.example src/frontend/.env.local
cp src/backend/env.example src/backend/.env

# Edit the files with your configuration
```

4. **Compile Midnight contracts (optional)**
```bash
cd contracts
compact compile CredentialRegistry.compact compiled/
compact compile ProofVerifier.compact compiled/
```

5. **Start the application**
```bash
# Start both frontend and backend
npm run start:all

# Or start individually
npm run start:backend  # Backend on port 3001
npm run start:frontend # Frontend on port 3000
   ```

This will start both the backend API (port 3001) and frontend (port 3000).

## 🔧 Midnight Blockchain Integration

### Smart Contracts
The project includes two main Midnight Compact contracts:

- **CredentialRegistry.compact**: Manages credential issuance and storage
- **ProofVerifier.compact**: Handles zero-knowledge proof verification

### Contract Compilation
```bash
# Install Midnight Compact compiler
# Follow instructions at: https://docs.midnight.network/

# Compile contracts
cd contracts
compact compile CredentialRegistry.compact compiled/
compact compile ProofVerifier.compact compiled/
```

### Backend Integration
The backend automatically integrates with compiled Midnight contracts:
- Credential issuance calls the `issueCredential` circuit
- Proof verification uses the `verifyProof` circuit
- All operations are logged for audit trails

### Environment Configuration
Configure your Midnight network settings:
```bash
# Backend (.env)
MIDNIGHT_NETWORK_URL=https://testnet.midnight.network
MIDNIGHT_RPC_URL=https://rpc.testnet.midnight.network

# Frontend (.env.local)
NEXT_PUBLIC_MIDNIGHT_NETWORK_URL=https://testnet.midnight.network
```

## 📁 Project Structure

```
ZkCredential-Access-Hub/
├── contracts/                 # Midnight Compact contracts
│   ├── CredentialRegistry.compact
│   ├── ProofVerifier.compact
│   └── compiled/             # Compiled contract outputs
├── src/
│   ├── backend/              # Express.js API server
│   │   ├── index.ts         # Main server file
│   │   ├── midnightService.ts # Midnight contract integration
│   │   └── data/            # Persistent storage
│   ├── frontend/            # Next.js React application
│   │   ├── app/            # App router pages
│   │   ├── globals.css     # Global styles
│   │   └── package.json    # Frontend dependencies
│   └── common/             # Shared types and utilities
├── .gitignore              # Git ignore rules
├── env.example            # Environment variables template
└── README.md             # This file
```

### Alternative: Manual Setup

1. **Backend Setup**
   ```bash
   cd src/backend
   npm install
   npm run dev
   ```

2. **Frontend Setup** (in a new terminal)
   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```

## 📱 Usage

### 1. Landing Page
- Visit `http://localhost:3000` to see the professional landing page
- Learn about the product features and use cases
- Click "Launch App" to access the credential management interface

### 2. Connect Wallet
- Click "Connect Wallet" in the app
- Select your preferred wallet (Midnight, MetaMask, etc.)
- Approve the connection in your wallet

### 3. Issue Credentials
- Select a credential type from the dropdown (KYC, StudentID, License, Age, Income)
- Enter a commitment hash (64-character hex string starting with 0x)
- Use "Generate Demo" button for testing
- Click "Issue Credential" to create the credential

### 4. Generate Proofs
- Select a credential from your list
- Define a predicate (e.g., "expiry > now", "issuer == trusted")
- Click "Generate Proof" to create a zero-knowledge proof
- The proof will be automatically verified

### 5. View Results
- See verification status and proof details
- Copy proof data to clipboard
- View detailed proof information

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend API   │    │  Midnight       │
│   (Next.js)     │◄──►│   (Express.js)   │◄──►│  Blockchain     │
│                 │    │                  │    │                 │
│ • Landing Page  │    │ • Credential     │    │ • Smart         │
│ • App Interface │    │   Management     │    │   Contracts     │
│ • Wallet Connect│    │ • Proof          │    │ • ZK Proofs     │
│ • ZK Proofs     │    │   Verification   │    │ • Privacy       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 API Endpoints

### Credential Management
- `POST /issue` - Issue a new credential
- `GET /credentials/:user` - Get user's credentials
- `POST /revoke` - Revoke a credential
- `GET /templates` - Get available credential templates

### Proof Verification
- `POST /verify` - Verify a zero-knowledge proof
- `GET /verification-history` - Get verification history
- `GET /stats` - Get system statistics

## 🎨 UI Improvements

### Landing Page
- **Hero Section**: Compelling value proposition with animated elements
- **Features Grid**: Clear explanation of core capabilities
- **Use Cases**: Real-world application examples
- **How It Works**: Step-by-step process explanation
- **Call-to-Action**: Clear path to app access

### App Interface
- **Fixed Layout Issues**: Generate proof button now properly aligns with input
- **Enhanced Forms**: Better validation and user feedback
- **Credential Templates**: Dropdown selection with descriptions
- **Demo Data**: One-click generation of test commitment hashes
- **Responsive Design**: Optimized for all screen sizes

### Visual Enhancements
- **Gradient Backgrounds**: Modern, animated gradient effects
- **Glass Morphism**: Subtle transparency and blur effects
- **Smooth Animations**: Hover effects and transitions
- **Consistent Typography**: Clear hierarchy and readability
- **Color System**: Cohesive dark theme with accent colors

## 🔒 Security Features

- **Input Validation**: Comprehensive validation for all inputs
- **Address Verification**: Ethereum address format validation
- **Commitment Hash Validation**: Proper hex string format checking
- **Signature Verification**: Cryptographic proof validation
- **Credential Status Checking**: Expiry and revocation validation

## 🧪 Testing

### Demo Data
- Use the "Generate Demo" button to create test commitment hashes
- Predefined credential templates for easy testing
- Sample predicates for proof generation

### Supported Credential Types
- **KYC**: Know Your Customer verification (1 year expiry)
- **StudentID**: Student identification (4 years expiry)
- **License**: Professional license/certification (2 years expiry)
- **Age**: Age verification (1 year expiry)
- **Income**: Income verification (90 days expiry)

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd src/frontend
npm run build
# Deploy the 'out' directory
```

### Backend (Railway/Heroku)
```bash
cd src/backend
npm run build
# Deploy with environment variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon

Built for **Midnight Hackathon 2025** - demonstrating privacy-preserving credential management on Midnight Blockchain.

## 🔗 Links

- **Repository**: [GitHub](https://github.com/Goketech/ZkCredential-Access-Hub)
- **Demo**: [Live Demo](https://zk-credential-access-hub-frontend.vercel.app/)
- **Documentation**: [Midnight Docs](https://docs.midnight.network/)

---

**Built with ❤️ for the Midnight ecosystem**