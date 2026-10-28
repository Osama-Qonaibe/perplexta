/**
 * Perplexta Platform - Markdown for Agents content generator
 * Implements Accept: text/markdown content negotiation as specified in llmstxt.org
 */

export function generateMarkdownForPage(path: string, origin: string): string {
  const lowercasePath = path.toLowerCase();

  // Core System Pitch & Description
  const defaultHeader = `# PERPLEXTA Platform\n\n> **Professional Elite Technical Analysis, ViralBook Advertising Ecosystem, Rinex Studio & Viral TopUp Financial Ledger**\n\nWelcome to PERPLEXTA — a sovereign full-stack cognitive platform managing dual PostgreSQL databases (Core and secure append-only Viral TopUp Ledger Vault), zero-latency AES-256 API Key Management, Rinex 4K visual/motion studio, and ViralBook interactive advertising.\n\n`;

  if (lowercasePath === '/' || lowercasePath.includes('index.html')) {
    return `${defaultHeader}## 🛠️ Key Platform Features

- **Multi-Agent Orchestration**: Transparent, dynamic model routing with silent failovers across top-tier providers (OpenAI, Gemini, Anthropic).
- **Double DB Isolation & Viral TopUp**: Absolute segregation of operational metrics and cryptographic transactional financial ledgers via Viral TopUp.
- **ViralBook Ecosystem**: Interactive advertising hub, verified reels, business pages, and community campaigns (\`/viralbook\`).
- **Rinex Studio**: 4K visual design, motion graphics, and cinematic video studio (\`/image-studio\`).
- **Secure File System**: Supports PDF-Bridge, secure physical erasure, and high-capacity secure uploads up to 100MB with dual-language validation.

## 🧭 System Endpoints & Agent Directory

- **Dynamic Agent Registration**: \`/api/auth/register-agent\`
- **Dynamic Key Minting & Tokens**: \`/api/auth/token\`
- **Identity Verification**: \`/api/auth/claim\`
- **API Catalog Specification**: \`/.well-known/api-catalog\`
- **MCP Discovery Card**: \`/.well-known/mcp/server-card.json\`

## 🛡️ Agent Integration Tutorial (RFC 7591 / Webbot Auth)

Secure client credentials grant authorization sample:

\`\`\`bash
curl -X POST "${origin}/api/auth/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'
\`\`\`

---
*Generated dynamically using Content Negotiation.*`;
  }

  if (lowercasePath.includes('chat')) {
    return `${defaultHeader}## 💬 Interactive Chat Lab & Reasoning Sandbox

The PERPLEXTA chat interface provides a low-latency environment connected directly to our dynamic Orchestrator.

### Features
- **Silent Failover**: Automatically proxies queries to active standby models if primary providers exceed computational quotas or error out.
- **Deep Intelligence Engine**: Unified ingest pipelines automatically parsing uploaded files (PDF/Text) up to 100MB.
- **Unified Controls**: Exclusivity matrix restricts parallel activation of duplicate tool paths to shield security.

### Current System Commands
- \`/api/chat/sessions\` - Read or construct conversational channels.
- \`/v1/data\` - File ingest gateway.`;
  }

  if (lowercasePath.includes('viralbook') || lowercasePath.includes('bulletin')) {
    return `${defaultHeader}## 📢 ViralBook Advertising & Community Ecosystem

ViralBook is PERPLEXTA's sovereign advertising, reels, and merchant page ecosystem (\`/viralbook\`).

### Features
- **Verified Business Pages**: Independent merchant profiles with custom slugs and product showcases.
- **Sponsored Campaigns**: Targeted ad placements and interactive reels with real-time analytics.`;
  }

  if (lowercasePath.includes('image-studio') || lowercasePath.includes('studio')) {
    return `${defaultHeader}## 🎨 Rinex 4K Visual & Motion Studio

Rinex Studio (\`/image-studio\`) is PERPLEXTA's professional visual design, vector editing, and 4K video production environment.`;
  }

  if (lowercasePath.includes('settings') || lowercasePath.includes('developer')) {
    return `${defaultHeader}## ⚙️ Settings, Viral TopUp & Active Developer Registry

Adjust user configuration, security keys, Viral TopUp wallets, or manage dynamic agents.

### Subsections
1. **General Identity**: Manage password patterns, system locale (AR/EN support), and profile tags.
2. **Double DB Ledger**: Complete view of transaction lists, balance credentials, and KYC status.
3. **Viral TopUp Wallet System**: Top-up wallets, manage subscriptions, or initiate payment actions.
4. **Developer Gateway**: Dynamically spawn registered bot accounts matching Webbot Auth specs.`;
  }

  if (lowercasePath.includes('rewards')) {
    return `${defaultHeader}## 🎁 Rewards Center & KYC Verification

Earn platform credits by sharing PERPLEXTA with friends, or secure your identity through our system verification.

### Guidelines
- **Referral Rewards**: Earn 10% credit from your network's transactional volume.
- **Identity (KYC)**: Upload credentials to unlock higher upload tiers (100MB) and Viral TopUp Ledger transfers.`;
  }

  if (lowercasePath.includes('subscription')) {
    return `${defaultHeader}## 💎 Viral TopUp & Membership Plans

Elevate your analysis limits by selecting one of our mathematical, highly discounted annual tiers backed by Viral TopUp.

### Available Tiers
- **Basic/Free**: Standard AI tools, daily volume limit of 5 codes.
- **Premium Elite**: High-capacity multi-agent routing, 100MB file parser, unlimited analytical models.`;
  }

  // Fallback high level page overview
  return `${defaultHeader}## 🧭 Site Route: \`${path}\`

You are looking at a virtual page path in the Perplexta Core platform.

### Standard Actions
- To return to the main dashboard: [Click here](${origin}/)
- To configure automated bots or keys: [Developer Hub](${origin}/settings?tab=developer)

---
*Perplexta Web Server Dynamic Responder*`;
}

export function estimateMarkdownTokens(text: string): number {
  // Safe character-count / 4 approximation for tokens
  return Math.ceil(text.length / 4) || 0;
}
