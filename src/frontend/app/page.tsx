"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Users,
  Key,
  Eye,
  Zap,
  Globe,
  Star,
  ChevronRight,
  Play,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const features = [
    {
      icon: Shield,
      title: "Zero-Knowledge Proofs",
      description: "Prove facts about yourself without revealing sensitive data using advanced cryptographic proofs.",
    },
    {
      icon: Lock,
      title: "Privacy-First Design",
      description: "Your credentials are encrypted and stored securely, with selective disclosure capabilities.",
    },
    {
      icon: Sparkles,
      title: "Decentralized & Trustless",
      description: "Built on Midnight Blockchain for maximum security and decentralization.",
    },
    {
      icon: Key,
      title: "Credential Management",
      description: "Issue, store, and manage digital credentials with full user control.",
    },
    {
      icon: Eye,
      title: "Selective Disclosure",
      description: "Choose exactly what information to reveal to verifiers while maintaining privacy.",
    },
    {
      icon: Zap,
      title: "Instant Verification",
      description: "Fast proof generation and verification for seamless user experiences.",
    },
  ]

  const useCases = [
    {
      title: "Identity Verification",
      description: "Prove age, citizenship, or identity without revealing personal details.",
      icon: Users,
    },
    {
      title: "Professional Credentials",
      description: "Verify degrees, certifications, and professional qualifications privately.",
      icon: Star,
    },
    {
      title: "Financial Services",
      description: "Access financial services while maintaining privacy of your financial data.",
      icon: Globe,
    },
  ]

  const stats = [
    { label: "Privacy-Preserving", value: "100%" },
    { label: "Decentralized", value: "✓" },
    { label: "Zero-Knowledge", value: "✓" },
    { label: "User-Controlled", value: "✓" },
  ]

  return (
    <div className="min-h-screen  text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold">ZK Credential Hub</span>
            </div>
            <div className="flex items-center gap-4">
                <button
                onClick={() => router.push("/app")}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                Launch App
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by Midnight Blockchain</span>
            </div>
            <h1 className="text-5xl md:text-6xl leading-[1.2] md:leading-[1.2] font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Privacy-Preserving
              <br />
              Credential Management
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Own, manage, and selectively disclose your credentials using zero-knowledge proofs. 
              Prove facts about yourself without revealing sensitive data on the Midnight Blockchain.
            </p>
            </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push("/app")}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all duration-200 text-lg"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Get Started
              <ArrowRight className={`w-5 h-5 transition-transform duration-200 ${isHovered ? "translate-x-1" : ""}`} />
            </button>
            <button
              onClick={() => router.push("https://youtu.be/ZEaq4dRzEos")}
             className="inline-flex bg-white hover:bg-white/90 items-center gap-2 px-8 py-4 border border-border hover:border-primary/50 rounded-xl font-semibold transition-colors text-lg">
              <Play className="w-5 h-5" />
              Watch Demo
                </button>
              </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ZK Credential Hub?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge zero-knowledge technology to give you complete control over your digital identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className=" rounded-2xl p-6 border hover:border-primary/50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real-World Applications</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how zero-knowledge credentials can transform your digital interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="rounded-2xl p-8 border text-center hover:border-primary/50 transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <useCase.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{useCase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
              </div>
            ))}
            </div>
                  </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to secure, privacy-preserving credential management.
            </p>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Connect your Midnight wallet to access the platform securely.",
              },
              {
                step: "02",
                title: "Issue Credentials",
                description: "Create and issue digital credentials with encrypted commitments.",
              },
              {
                step: "03",
                title: "Generate Proofs",
                description: "Create zero-knowledge proofs for selective disclosure.",
              },
              {
                step: "04",
                title: "Verify & Access",
                description: "Verifiers can validate proofs without seeing your data.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                {index < 3 && (
                  <ChevronRight className="w-6 h-6 text-muted-foreground mx-auto mt-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="card-gradient rounded-3xl p-12 border">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-muted-foreground">Ready to Take Control of Your Digital Identity?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the future of privacy-preserving credential management. Start using zero-knowledge proofs today.
            </p>
            <button
              onClick={() => router.push("/app")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors text-lg"
            >
              Launch ZK Credential Hub
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold">ZK Credential Hub</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Privacy-preserving credential management powered by zero-knowledge proofs on Midnight Blockchain.
              </p>
              <div className="flex gap-4">
                <button className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                  <Github className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                  <Twitter className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                  <Linkedin className="w-5 h-5" />
                  </button>
              </div>
            </div>
                  <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><button className="hover:text-foreground transition-colors">Features</button></li>
                <li><button className="hover:text-foreground transition-colors">Documentation</button></li>
                <li><button className="hover:text-foreground transition-colors">API</button></li>
                <li><button className="hover:text-foreground transition-colors">Integrations</button></li>
              </ul>
                  </div>
                  <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><button className="hover:text-foreground transition-colors">Discord</button></li>
                <li><button className="hover:text-foreground transition-colors">Twitter</button></li>
                <li><button className="hover:text-foreground transition-colors">GitHub</button></li>
                <li><button className="hover:text-foreground transition-colors">Blog</button></li>
              </ul>
                  </div>
                </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 ZK Credential Hub. Built for Midnight Hackathon 2025.</p>
                </div>
              </div>
      </footer>
    </div>
  )
}