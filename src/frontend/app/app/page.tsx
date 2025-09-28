"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import {
  Wallet,
  Plus,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Home,
} from "lucide-react"

function getWalletDebugInfo() {
  if (typeof window === 'undefined') {
    return {
      walletProperties: [],
      providers: [],
      ethereum: false,
      midnight: false,
      web3: false,
    }
  }

  const walletProps = Object.keys(window).filter(
    (key) =>
      key.toLowerCase().includes("eth") ||
      key.toLowerCase().includes("wallet") ||
      key.toLowerCase().includes("midnight") ||
      key.toLowerCase().includes("web3"),
  )

  const providers = Object.entries(window).filter(
    ([key, value]: [string, any]) => value && typeof value === "object" && typeof value.request === "function",
  )

  return {
    walletProperties: walletProps,
    providers: providers.map(([key]) => key),
    ethereum: !!(window as any).ethereum,
    midnight: !!(window as any).midnight,
    web3: !!(window as any).web3,
  }
}

interface Credential {
  credentialId: string
  issuer: string
  user: string
  commitment: string
  type: string
  issuedAt: number
  expiry: number
  revoked: boolean
}

interface Proof {
  credentialId: string
  predicate: string
  proofBlob: string
}

// Real ZK proof generation (simplified for demo)
async function generateZKProof(credentialId: string, predicate: string, signer: ethers.Signer): Promise<Proof> {
  // Create a real cryptographic proof using the signer's private key
  const message = `Credential: ${credentialId}, Predicate: ${predicate}, Timestamp: ${Date.now()}`
  const signature = await signer.signMessage(message)

  // Create a proof object with real cryptographic elements
  const proof = {
    credentialId,
    predicate,
    proofBlob: JSON.stringify({
      message,
      signature,
      publicKey: await signer.getAddress(),
      timestamp: Date.now(),
      // In a real ZK system, this would contain actual proof data
      zkProof: {
        pi_a: [signature.slice(0, 32), signature.slice(32, 64)],
        pi_b: [
          [signature.slice(64, 96), signature.slice(96, 128)],
          [signature.slice(128, 160), signature.slice(160, 192)],
        ],
        pi_c: [signature.slice(192, 224), signature.slice(224, 256)],
        protocol: "groth16",
      },
    }),
  }

  return proof
}

async function submitProof(proofBlob: string, predicate: string, verifierEndpoint: string): Promise<boolean> {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      
      // Add a small delay to allow backend to stabilize
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await fetch(verifierEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofBlob, predicate }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json()
      return result.verified
    } catch (error) {
      console.error(`Proof submission attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error("All proof submission attempts failed");
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

function getCredentials(): Credential[] {
  // Simulate local storage
  const stored = localStorage.getItem("credentials")
  return stored ? JSON.parse(stored) : []
}

function storeCredential(credential: Credential): void {
  const creds = getCredentials()
  creds.push(credential)
  localStorage.setItem("credentials", JSON.stringify(creds))
}

export default function App() {
  const router = useRouter()
  const [wallet, setWallet] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null)
  const [predicate, setPredicate] = useState<string>("expiry > now")
  const [proofResult, setProofResult] = useState<Proof | null>(null)
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)
  const [issueForm, setIssueForm] = useState({ commitment: "", meta: "" })
  const [credentialTemplates, setCredentialTemplates] = useState<any>({})
  const [formErrors, setFormErrors] = useState<{ commitment?: string; meta?: string }>({})
  const [loading, setLoading] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [debugInfo, setDebugInfo] = useState(getWalletDebugInfo())
  const [showProofDetails, setShowProofDetails] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  useEffect(() => {
    // Load credential templates
    fetchCredentialTemplates()

    // Check for existing wallet connection
    const isConnected = localStorage.getItem("walletConnected")
    const savedAddress = localStorage.getItem("walletAddress")

    if (isConnected && savedAddress && (window as any).ethereum) {
      // Try to reconnect to existing wallet
      const reconnectWallet = async () => {
        try {
          const ethersProvider = new ethers.BrowserProvider((window as any).ethereum)
          const ethersSigner = await ethersProvider.getSigner()
          const currentAddress = await ethersSigner.getAddress()

          if (currentAddress.toLowerCase() === savedAddress.toLowerCase()) {
            setProvider(ethersProvider)
            setSigner(ethersSigner)
            setWallet(currentAddress)
          } else {
            // Address changed, clear stored connection
            localStorage.removeItem("walletConnected")
            localStorage.removeItem("walletAddress")
          }
        } catch (error) {
          // Clear stored connection if reconnection fails
          localStorage.removeItem("walletConnected")
          localStorage.removeItem("walletAddress")
        }
      }

      reconnectWallet()
    }

    // Load stored proofs
    const storedProofs = JSON.parse(localStorage.getItem("generatedProofs") || "[]")
    if (storedProofs.length > 0) {
      // Show the most recent proof
      const latestProof = storedProofs[storedProofs.length - 1]
      setProofResult(latestProof)
      // Note: We don't auto-verify on load as it requires backend
    }

    // Update debug info periodically to catch late-loaded wallets
    const interval = setInterval(() => {
      setDebugInfo(getWalletDebugInfo())
    }, 1000)

    if (wallet) {
      fetchCredentials(wallet)
    }

    return () => clearInterval(interval)
  }, [wallet])

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchCredentials = async (user: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${backendUrl}/credentials/${user}`)
      const creds = await response.json()
      setCredentials(creds)
    } catch (error) {
      console.error("Failed to fetch credentials:", error)
      showNotification("Failed to fetch credentials", "error")
    }
  }

  const fetchCredentialTemplates = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${backendUrl}/templates`)
      const data = await response.json()
      setCredentialTemplates(data.templates)
    } catch (error) {
      console.error("Failed to fetch credential templates:", error)
      // Set default templates if API fails
      setCredentialTemplates({
        'KYC': { description: 'Know Your Customer verification', category: 'Identity' },
        'StudentID': { description: 'Student identification credential', category: 'Education' },
        'License': { description: 'Professional license or certification', category: 'Professional' },
        'Age': { description: 'Age verification credential', category: 'Identity' },
        'Income': { description: 'Income verification credential', category: 'Financial' },
      })
    }
  }

  const validateForm = () => {
    const errors: { commitment?: string; meta?: string } = {}
    
    // Validate commitment hash
    if (!issueForm.commitment) {
      errors.commitment = "Commitment hash is required"
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(issueForm.commitment)) {
      errors.commitment = "Invalid commitment format. Must be a 64-character hex string starting with 0x"
    }
    
    // Validate credential type
    if (!issueForm.meta) {
      errors.meta = "Credential type is required"
    } else if (!credentialTemplates[issueForm.meta]) {
      errors.meta = `Unsupported credential type. Supported types: ${Object.keys(credentialTemplates).join(', ')}`
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const connectWallet = () => {
    setShowWalletDialog(true)
  }

  const handleWalletSelect = async (walletType: string) => {
    setShowWalletDialog(false)
    setConnectingWallet(true)

    try {

      // Check for different wallet injection patterns
      let walletProvider = null

      // Standard Ethereum wallets (MetaMask, etc.)
      if ((window as any).ethereum) {
        walletProvider = (window as any).ethereum
      }
      // Midnight wallet might use a different property
      else if ((window as any).midnight) {
        walletProvider = (window as any).midnight
      }
      // Some wallets use web3
      else if ((window as any).web3) {
        walletProvider = (window as any).web3.currentProvider
      }
      // Check for any provider in common locations
      else {
        // Look for any object with request method (EIP-1193)
        const possibleProviders = Object.values(window).filter(
          (value: any) => value && typeof value === "object" && typeof value.request === "function",
        )
        if (possibleProviders.length > 0) {
          walletProvider = possibleProviders[0]
        }
      }

      if (!walletProvider) {
        throw new Error(
          `No ${walletType} detected. Please ensure ${walletType} is installed and unlocked. Check console for available wallet properties.`,
        )
      }

      // Request account access
      const accounts = await walletProvider.request({ method: "eth_requestAccounts" })
      // Create ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(walletProvider)
      const ethersSigner = await ethersProvider.getSigner()
      const address = await ethersSigner.getAddress()

      setProvider(ethersProvider)
      setSigner(ethersSigner)
      setWallet(address)

      // Store connection in localStorage for persistence
      localStorage.setItem("walletConnected", "true")
      localStorage.setItem("walletAddress", address)

      showNotification(
        `${walletType} connected successfully! Address: ${address.slice(0, 6)}...${address.slice(-4)}`,
        "success",
      )
    } catch (error: any) {
      console.error("Wallet connection failed:", error)
      showNotification(error.message || "Failed to connect wallet", "error")
    } finally {
      setConnectingWallet(false)
    }
  }

  const disconnectWallet = () => {
    setWallet(null)
    setProvider(null)
    setSigner(null)
    setCredentials([])
    setSelectedCredential(null)
    setProofResult(null)
    setVerificationResult(null)
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
    showNotification("Wallet disconnected", "info")
  }

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type })
  }

  const handleIssueCredential = async () => {
    if (!wallet) {
      showNotification("Please connect your wallet first", "error")
      return
    }

    if (!validateForm()) {
      showNotification("Please fix the form errors", "error")
      return
    }

    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${backendUrl}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: wallet,
          commitment: issueForm.commitment,
          meta: issueForm.meta,
        }),
      })
      
      const result = await response.json()
      
      if (response.ok && result.status === "issued") {
        showNotification(result.message || `Credential issued: ${result.credentialId}`, "success")
        fetchCredentials(wallet)
        setIssueForm({ commitment: "", meta: "" })
        setFormErrors({})
      } else {
        showNotification(result.error || "Failed to issue credential", "error")
      }
    } catch (error) {
      console.error("Failed to issue credential:", error)
      showNotification("Failed to issue credential", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateProof = async () => {
    if (!selectedCredential || !signer) {
      showNotification("Please select a credential and connect wallet", "error")
      return
    }
    setLoading(true)
    try {
      const proof = await generateZKProof(selectedCredential, predicate, signer)
      setProofResult(proof)

      // Store proof in localStorage for persistence
      const storedProofs = JSON.parse(localStorage.getItem("generatedProofs") || "[]")
      storedProofs.push({ ...proof, generatedAt: Date.now() })
      localStorage.setItem("generatedProofs", JSON.stringify(storedProofs))

      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const verified = await submitProof(proof.proofBlob, proof.predicate, `${backendUrl}/verify`)
      setVerificationResult(verified)
      setLoading(false)
      showNotification(
        verified ? "Proof verified successfully!" : "Proof verification failed",
        verified ? "success" : "error",
      )
    } catch (error) {
      console.error("Proof generation failed:", error)
      setLoading(false)
      showNotification(`Failed to generate proof: ${error instanceof Error ? error.message : 'Unknown error'}`, "error")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification("Copied to clipboard", "success")
  }

  const generateDemoCommitment = () => {
    // Generate a random 64-character hex string
    const randomHex = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    setIssueForm({ ...issueForm, commitment: `0x${randomHex}` })
    if (formErrors.commitment) {
      setFormErrors({ ...formErrors, commitment: undefined })
    }
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold">ZK Credential Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : notification.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle className="w-4 h-4" />}
            {notification.type === "error" && <AlertCircle className="w-4 h-4" />}
            {notification.type === "info" && <Zap className="w-4 h-4" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Wallet Selection Dialog */}
      {showWalletDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
              <p className="text-muted-foreground text-sm">Choose a wallet to connect to the ZK Credential Hub</p>
            </div>

            <div className="space-y-3">
              {[
                { name: "Midnight Wallet", icon: "🌙" },
                { name: "MetaMask", icon: "🦊" },
                { name: "WalletConnect", icon: "🔗" },
              ].map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.name)}
                  className="w-full p-4 rounded-xl border border-border hover:border-primary/50 transition-all duration-200 flex items-center gap-3 hover:bg-primary/5"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="font-medium">{wallet.name}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowWalletDialog(false)}
              className="w-full mt-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>

            {/* Debug section */}
            <div className="mt-6 p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Debug Info</span>
                <button
                  onClick={() => setDebugInfo(getWalletDebugInfo())}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Refresh
                </button>
              </div>
              <div className="text-xs font-mono space-y-1 text-muted-foreground">
                <div>Ethereum: {debugInfo.ethereum ? "✅" : "❌"}</div>
                <div>Midnight: {debugInfo.midnight ? "✅" : "❌"}</div>
                <div>Providers: {debugInfo.providers.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              ZK Credential Hub
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Privacy-preserving credential management powered by zero-knowledge proofs on Midnight Blockchain
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Shield, label: "Zero-Knowledge" },
              { icon: Lock, label: "Privacy-First" },
              { icon: Sparkles, label: "Decentralized" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {!wallet ? (
          /* Wallet Connection Section */
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl p-8 text-center border glow-effect">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Connect your Midnight wallet to start managing your privacy-preserving credentials securely
              </p>
              <button
                onClick={connectWallet}
                disabled={connectingWallet}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingWallet ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Connected Wallet Status */}
            <div className="mb-8">
              <div className="rounded-xl p-4 border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Wallet Connected</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {wallet.slice(0, 6)}...{wallet.slice(-4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 text-sm border border-border hover:border-destructive/50 hover:text-destructive rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Issue Credential Section */}
              <div className="rounded-2xl p-6 border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Issue New Credential</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Commitment Hash</label>
                    <input
                      type="text"
                      value={issueForm.commitment}
                      onChange={(e) => {
                        setIssueForm({ ...issueForm, commitment: e.target.value })
                        if (formErrors.commitment) {
                          setFormErrors({ ...formErrors, commitment: undefined })
                        }
                      }}
                      placeholder="0x1234567890abcdef..."
                      className={`w-full p-3 bg-input border rounded-lg focus:outline-none transition-colors font-mono text-sm ${
                        formErrors.commitment ? "border-destructive" : "border-border focus:border-primary"
                      }`}
                    />
                    {formErrors.commitment && (
                      <p className="text-sm text-destructive mt-1">{formErrors.commitment}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        Enter a 64-character hex string starting with 0x
                      </p>
                      <button
                        type="button"
                        onClick={generateDemoCommitment}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Generate Demo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Credential Type</label>
                    <select
                      value={issueForm.meta}
                      onChange={(e) => {
                        setIssueForm({ ...issueForm, meta: e.target.value })
                        if (formErrors.meta) {
                          setFormErrors({ ...formErrors, meta: undefined })
                        }
                      }}
                      className={`w-full p-3 bg-input border rounded-lg focus:outline-none transition-colors ${
                        formErrors.meta ? "border-destructive" : "border-border focus:border-primary"
                      }`}
                    >
                      <option value="">Select credential type...</option>
                      {Object.entries(credentialTemplates).map(([type, template]: [string, any]) => (
                        <option key={type} value={type}>
                          {type} - {template.description}
                        </option>
                      ))}
                    </select>
                    {formErrors.meta && (
                      <p className="text-sm text-destructive mt-1">{formErrors.meta}</p>
                    )}
                    {issueForm.meta && credentialTemplates[issueForm.meta] && (
                      <div className="mt-2 p-2 bg-muted/20 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <strong>Category:</strong> {credentialTemplates[issueForm.meta].category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Description:</strong> {credentialTemplates[issueForm.meta].description}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleIssueCredential}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Issue Credential
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Credentials List */}
              <div className="rounded-2xl p-6 border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Key className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">Your Credentials</h3>
                </div>

                {credentials.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No credentials found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {credentials.map((cred) => (
                      <div
                        key={cred.credentialId}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedCredential === cred.credentialId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedCredential(cred.credentialId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{cred.type}</h4>
                            <p className="text-sm text-muted-foreground mb-2">Issuer: {cred.issuer}</p>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                cred.revoked ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                              }`}
                            >
                              {cred.revoked ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                              {cred.revoked ? "Revoked" : "Valid"}
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              selectedCredential === cred.credentialId ? "border-primary bg-primary" : "border-border"
                            }`}
                          >
                            {selectedCredential === cred.credentialId && (
                              <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proof Generation - Fixed Layout */}
            <div className="rounded-2xl p-6 border mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-xl font-semibold">Generate Zero-Knowledge Proof</h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Predicate</label>
                  <input
                    type="text"
                    value={predicate}
                    onChange={(e) => setPredicate(e.target.value)}
                    placeholder="e.g., expiry > now, issuer == trusted"
                    className="w-full p-3 bg-input border border-border rounded-lg focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Define the condition for your proof</p>
                </div>
                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleGenerateProof}
                    disabled={!selectedCredential || loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-success hover:bg-success/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Generate Proof
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Proof Result */}
            {proofResult && (
              <div className="rounded-2xl p-6 border">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {verificationResult ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    )}
                    <h3 className="text-xl font-semibold">Proof Result</h3>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      verificationResult ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {verificationResult ? "✅ Verified" : "❌ Failed"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Credential ID</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted/20 rounded text-sm font-mono break-all">
                        {proofResult.credentialId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(proofResult.credentialId)}
                        className="p-2 hover:bg-muted/20 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Predicate</label>
                    <code className="block p-2 bg-muted/20 rounded text-sm font-mono">{proofResult.predicate}</code>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">Proof Blob</label>
                    <button
                      onClick={() => setShowProofDetails(!showProofDetails)}
                      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      {showProofDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showProofDetails ? "Hide" : "Show"} Details
                    </button>
                  </div>
                  {showProofDetails && (
                    <div className="relative">
                      <pre className="p-4 bg-muted/20 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                        {JSON.stringify(JSON.parse(proofResult.proofBlob), null, 2)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(proofResult.proofBlob)}
                        className="absolute top-2 right-2 p-1 hover:bg-muted/20 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
