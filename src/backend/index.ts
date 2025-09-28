import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { midnightService } from './midnightService';

// Load environment variables
const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);
const HOST = process.env.BACKEND_HOST || 'localhost';
const CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
const app = express();
app.use(cors({
  origin: CORS_ORIGINS.split(','),
  credentials: true
}));
app.use(express.json());

// In-memory storage for demo (replace with actual contract calls)
interface StoredCredential {
  credentialId: string;
  issuer: string;
  user: string;
  commitment: string;
  type: string;
  issuedAt: number;
  expiry: number;
  revoked: boolean;
  metadata?: {
    description?: string;
    issuerName?: string;
    category?: string;
  };
}

interface VerificationResult {
  verified: boolean;
  message: string;
  recoveredAddress?: string;
  claimedAddress?: string;
  timestamp: number;
  credentialId?: string;
  predicate?: string;
}

const credentialsStore: Map<string, StoredCredential> = new Map();
const verificationHistory: VerificationResult[] = [];

// File paths for persistence
const DATA_DIR = path.join(__dirname, 'data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
const VERIFICATION_FILE = path.join(DATA_DIR, 'verifications.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing data on startup
function loadData() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const credentialsData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      credentialsData.forEach((cred: StoredCredential) => {
        credentialsStore.set(cred.credentialId, cred);
      });
      console.log(`Loaded ${credentialsStore.size} credentials from file`);
    }
    
    if (fs.existsSync(VERIFICATION_FILE)) {
      const verificationData = JSON.parse(fs.readFileSync(VERIFICATION_FILE, 'utf8'));
      verificationHistory.push(...verificationData);
      console.log(`Loaded ${verificationHistory.length} verification records from file`);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to files
function saveData() {
  try {
    const credentialsArray = Array.from(credentialsStore.values());
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentialsArray, null, 2));
    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(verificationHistory, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data on startup
loadData();
console.log('Backend initialized. Current credentials count:', credentialsStore.size);

// Enhanced credential types with predefined templates
const CREDENTIAL_TEMPLATES = {
  'KYC': {
    description: 'Know Your Customer verification',
    category: 'Identity',
    defaultExpiry: 365 * 24 * 60 * 60 * 1000, // 1 year
  },
  'StudentID': {
    description: 'Student identification credential',
    category: 'Education',
    defaultExpiry: 4 * 365 * 24 * 60 * 60 * 1000, // 4 years
  },
  'License': {
    description: 'Professional license or certification',
    category: 'Professional',
    defaultExpiry: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  },
  'Age': {
    description: 'Age verification credential',
    category: 'Identity',
    defaultExpiry: 365 * 24 * 60 * 60 * 1000, // 1 year
  },
  'Income': {
    description: 'Income verification credential',
    category: 'Financial',
    defaultExpiry: 90 * 24 * 60 * 60 * 1000, // 90 days
  },
};

// Enhanced credential issuance with validation and templates
function callContractIssueCredential(user: string, commitment: string, meta: string): { credentialId: string; credential: StoredCredential } {
  // Validate inputs
  if (!user || !commitment || !meta) {
    throw new Error('Missing required fields: user, commitment, meta');
  }

  // Validate Ethereum address format
  if (!ethers.isAddress(user)) {
    throw new Error('Invalid user address format');
  }

  // Validate commitment hash format (should be hex string)
  if (!/^0x[a-fA-F0-9]{64}$/.test(commitment)) {
    throw new Error('Invalid commitment format. Must be a 64-character hex string starting with 0x');
  }

  const credentialId = 'credential-' + Math.random().toString(36).substring(2, 10);
  const now = Date.now();

  // Parse meta field and get template
  const type = meta.trim();
  const template = CREDENTIAL_TEMPLATES[type as keyof typeof CREDENTIAL_TEMPLATES];
  
  if (!template) {
    throw new Error(`Unsupported credential type: ${type}. Supported types: ${Object.keys(CREDENTIAL_TEMPLATES).join(', ')}`);
  }

  const expiry = now + template.defaultExpiry;

  const credential: StoredCredential = {
    credentialId,
    issuer: 'zk-credential-hub',
    user: user.toLowerCase(),
    commitment,
    type,
    issuedAt: now,
    expiry,
    revoked: false,
    metadata: {
      description: template.description,
      issuerName: 'ZK Credential Hub',
      category: template.category,
    }
  };
  
  credentialsStore.set(credentialId, credential);
  saveData(); // Save to file immediately
  console.log(`Credential issued: ${credentialId} for user: ${user}`);
  console.log('Total credentials in store:', credentialsStore.size);
  return { credentialId, credential };
}

app.post('/issue', async (req: Request, res: Response) => {
  try {
    const { user, commitment, meta } = req.body;
    
    if (!user || !commitment || !meta) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'user, commitment, and meta are required',
        supportedTypes: Object.keys(CREDENTIAL_TEMPLATES)
      });
    }

    // Issue credential via Midnight contract
    console.log('Issuing credential via Midnight contract...');
    const contractCredentialId = await midnightService.issueCredential(user, commitment, meta);
    
    // Also store in local store for backward compatibility
    const result = callContractIssueCredential(user, commitment, meta);
    
    console.log(`Credential issued: ${result.credentialId} for user: ${user}`);
    console.log(`Contract credential ID: ${contractCredentialId}`);
    
    res.json({ 
      status: 'issued', 
      credentialId: result.credentialId,
      contractCredentialId: contractCredentialId,
      credential: result.credential,
      message: `Credential of type '${result.credential.type}' issued successfully via Midnight contract`
    });
  } catch (error: any) {
    console.error('Credential issuance error:', error);
    res.status(400).json({ 
      error: error.message,
      supportedTypes: Object.keys(CREDENTIAL_TEMPLATES)
    });
  }
});

function callContractRevokeCredential(credentialId: string): boolean {
  const cred = credentialsStore.get(credentialId);
  if (cred) {
    cred.revoked = true;
    saveData(); // Save to file immediately
    console.log(`Credential revoked: ${credentialId}`);
    return true;
  }
  return false;
}

app.post('/revoke', async (req: Request, res: Response) => {
  const { credentialId } = req.body;
  if (!credentialId) {
    return res.status(400).json({ error: 'Missing credentialId' });
  }
  const result = callContractRevokeCredential(credentialId);
  res.json({ status: result ? 'revoked' : 'not found' });
});

function callContractGetCredentials(user: string): StoredCredential[] {
  const userCredentials = Array.from(credentialsStore.values()).filter(cred => cred.user.toLowerCase() === user.toLowerCase());
  console.log(`Fetching credentials for user: ${user}`);
  console.log(`Found ${userCredentials.length} credentials for user ${user}`);
  console.log('All credentials in store:', Array.from(credentialsStore.values()).map(c => ({ id: c.credentialId, user: c.user, type: c.type })));
  return userCredentials;
}

app.get('/credentials/:user', async (req: Request, res: Response) => {
  const user = req.params.user;
  const credentials = callContractGetCredentials(user);
  res.json(credentials);
});

// Enhanced verification endpoint
app.post('/verify', async (req: Request, res: Response) => {
  const { proofBlob, predicate } = req.body;

  console.log('Verification request received:', { 
    hasProofBlob: !!proofBlob, 
    predicate, 
    proofBlobLength: proofBlob?.length 
  });

  try {
    // Add a small delay to ensure server is stable
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!proofBlob) {
      console.log('Verification failed: No proof blob provided');
      return res.status(400).json({
        verified: false,
        message: 'Proof blob is required'
      });
    }

    // Parse the proof data
    console.log('Parsing proof blob...');
    const proofData = JSON.parse(proofBlob);
    console.log('Proof data parsed successfully:', { 
      hasMessage: !!proofData.message, 
      hasSignature: !!proofData.signature, 
      hasPublicKey: !!proofData.publicKey,
      credentialId: proofData.credentialId 
    });

    // Validate proof structure
    if (!proofData.message || !proofData.signature || !proofData.publicKey) {
      console.log('Verification failed: Invalid proof structure', {
        hasMessage: !!proofData.message,
        hasSignature: !!proofData.signature,
        hasPublicKey: !!proofData.publicKey
      });
      return res.status(400).json({
        verified: false,
        message: 'Invalid proof format - missing required fields'
      });
    }

    // Verify the signature
    const message = proofData.message;
    const signature = proofData.signature;
    const signerAddress = proofData.publicKey;
    const credentialId = proofData.credentialId;

    // Verify via Midnight contract
    console.log('Verifying proof via Midnight contract...');
    const contractVerificationResult = await midnightService.verifyProof(proofBlob, predicate);
    console.log('Contract verification result:', contractVerificationResult);

    // Also do local signature verification for backward compatibility
    console.log('Verifying signature locally...');
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log('Signature verification result:', { recoveredAddress, claimedAddress: signerAddress });

    // Check if the recovered address matches the claimed signer
    const isValid = recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    console.log('Signature valid:', isValid);

    // Additional validation: check if credential exists and is valid
    let credentialValid = true;
    let credentialStatus = 'unknown';
    
    if (credentialId) {
      const credential = credentialsStore.get(credentialId);
      if (credential) {
        credentialValid = !credential.revoked && credential.expiry > Date.now();
        credentialStatus = credential.revoked ? 'revoked' : 
                          credential.expiry <= Date.now() ? 'expired' : 'valid';
      } else {
        credentialValid = false;
        credentialStatus = 'not_found';
      }
    }

    const finalVerification = isValid && credentialValid && contractVerificationResult;

    // Store verification result
    const verificationResult: VerificationResult = {
      verified: finalVerification,
      message: finalVerification ? 'Proof verified successfully' : 'Proof verification failed',
      recoveredAddress,
      claimedAddress: signerAddress,
      timestamp: Date.now(),
      credentialId,
      predicate
    };
    
    verificationHistory.push(verificationResult);
    saveData(); // Save verification history

    // Add some delay to simulate verification time
    await new Promise(resolve => setTimeout(resolve, 500));

    res.json({
      verified: finalVerification,
      message: finalVerification ? 'Proof verified successfully' : 'Proof verification failed',
      recoveredAddress,
      claimedAddress: signerAddress,
      credentialStatus,
      timestamp: verificationResult.timestamp,
      details: {
        signatureValid: isValid,
        credentialValid,
        credentialStatus
      }
    });
  } catch (error) {
    console.error('Proof verification error:', error);
    res.status(400).json({
      verified: false,
      message: 'Invalid proof format or verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New endpoint to get credential templates
app.get('/templates', (req: Request, res: Response) => {
  res.json({
    templates: CREDENTIAL_TEMPLATES,
    message: 'Available credential templates'
  });
});

// New endpoint to get verification history
app.get('/verification-history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const recentHistory = verificationHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
  
  res.json({
    history: recentHistory,
    total: verificationHistory.length,
    limit
  });
});

// New endpoint to get credential statistics
app.get('/stats', (req: Request, res: Response) => {
  const credentials = Array.from(credentialsStore.values());
  const stats = {
    totalCredentials: credentials.length,
    activeCredentials: credentials.filter(c => !c.revoked && c.expiry > Date.now()).length,
    revokedCredentials: credentials.filter(c => c.revoked).length,
    expiredCredentials: credentials.filter(c => !c.revoked && c.expiry <= Date.now()).length,
    totalVerifications: verificationHistory.length,
    successfulVerifications: verificationHistory.filter(v => v.verified).length,
    credentialTypes: Object.keys(CREDENTIAL_TEMPLATES).reduce((acc, type) => {
      acc[type] = credentials.filter(c => c.type === type).length;
      return acc;
    }, {} as Record<string, number>)
  };
  
  res.json(stats);
});

// Debug endpoint to see all credentials
app.get('/debug/credentials', (req: Request, res: Response) => {
  const allCredentials = Array.from(credentialsStore.values());
  res.json({
    total: allCredentials.length,
    credentials: allCredentials.map(c => ({
      credentialId: c.credentialId,
      user: c.user,
      type: c.type,
      issuedAt: new Date(c.issuedAt).toISOString(),
      revoked: c.revoked
    }))
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Issuer API running on ${HOST}:${PORT}`);
  console.log(`CORS origins: ${CORS_ORIGINS}`);
});
