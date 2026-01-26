# How Was I Hacked - Product Requirements Document

## Overview

**Project Name:** How Was I Hacked
**Type:** Web Application (Mobile-first, responsive)
**Purpose:** Help crypto users understand how their wallet was compromised through a guided diagnostic questionnaire, then educate them on best practices to prevent future incidents.

**Sister Project:** [HackedWalletRecovery.com](https://hackedwalletrecovery.com) - Recovery tool for compromised wallets (supports Ethereum, BSC, and many L2s)

---

## Design Philosophy

### Tone & Voice
- **Compassionate and empathetic** - Users are stressed and hurting
- **Direct and factual** - When delivering security advice, be clear and authoritative
- **Non-judgmental** - "This happens to a lot of people. You're not alone."
- **Hopeful** - Focus on what they can do better going forward

### Visual Style
- Mental health app aesthetic - calm, minimal, reassuring
- Soft colors, generous whitespace
- Mobile-first design
- No progress indicators (paths vary in length)

### Key Phrases (Elliott Alexander style)
- "No free lunch in crypto, just like everywhere else"
- "If it's too good to be true, it probably is"
- "You can't actually buy wallets because the seller will always know the private key"
- "You're not alone, and now you know better"

---

## User Flow

### Entry Point

**Welcome Screen:**
> **We're sorry you're here.**
>
> Getting hacked is one of the worst feelings in crypto. We know how much it hurts.
>
> This tool will help you understand what likely happened so you can protect yourself going forward. We'll ask you a few questions - take your time.
>
> **Let's figure this out together.**
>
> [Get Started]

**Navigation:** Persistent top nav with link to "Learn Best Practices" section

---

### Question Flow

#### Q1: Wallet Type

> **What type of wallet were you using?**

| Option | Description |
|--------|-------------|
| Browser Extension | MetaMask, Rabby, Coinbase Wallet, Phantom, Other |
| Mobile Wallet | Trust Wallet, Rainbow, Coinbase Wallet, Phantom, Other |
| Hardware Wallet | Ledger, Trezor, GridPlus, Other |
| Other | For wallets that don't fit above categories |

*This selection affects which questions appear later and adjusts probability weights for different hack vectors.*

---

#### Q2: Value Lost

> **Roughly how much did you lose?**
>
> This helps us understand the scale of these attacks across the community.

| Option |
|--------|
| Under $100 |
| $100 - $1,000 |
| $1,000 - $10,000 |
| $10,000 - $100,000 |
| Over $100,000 |
| Prefer not to say |

---

#### Q3: When Did It Happen?

> **Were you actively using your wallet when the funds disappeared, or did you notice it later?**

| Option | Leads To |
|--------|----------|
| I was using my wallet at the time | Malicious Transaction Path |
| I noticed it later / wasn't using it | Seed Phrase Compromise Path |
| I'm not sure | Seed Phrase Compromise Path (more common) |

---

## Decision Tree Paths

### Path A: Seed Phrase Compromise (Noticed Later)

This is the most common path. User wasn't actively using wallet when drain occurred.

#### A1: Seed Phrase Backup

> **Do you have a backup of your seed phrase (the 12 or 24 words)?**

| Option | Next |
|--------|------|
| Yes | A2: Storage Method |
| No | A5: Downloaded Files |
| I'm not sure what that is | Brief explanation, then A5 |

---

#### A2: Storage Method

> **How are you storing your seed phrase?**

| Option | Probability Adjustment |
|--------|----------------------|
| Wrote it down physically and stored in a safe place | Low risk - continue to other paths |
| Screenshot or photo on my phone | HIGH RISK → Diagnosis: Phone Storage |
| Notes app or text file on my computer | HIGH RISK → Diagnosis: Digital Storage |
| Cloud storage (Google Drive, iCloud, Dropbox, email) | HIGH RISK → Diagnosis: Cloud Storage |
| Password manager | Medium risk - go to A3 |
| I've stored it multiple ways | Follow up on each method |

---

#### A3: Password Manager Follow-up

> **For your password manager, are you using a very long, unique password that you don't use anywhere else?**

| Option | Next |
|--------|------|
| Yes, completely unique and strong | Accept as secure for now, continue to A4 |
| No / I reuse passwords | → Diagnosis: Password Reuse |
| I'm not sure | Provide links to check if passwords leaked (haveibeenpwned.com), then continue to A4 |

---

#### A4: Copy/Paste Habits

> **Have you ever copied and pasted your seed phrase or private key?**
>
> This includes pasting into websites, apps, code files, or moving between different wallets.

| Option | Next |
|--------|------|
| Yes | A4a: Where did you paste it? |
| No | A5: Downloaded Files |
| I don't remember | A5: Downloaded Files |

---

#### A4a: Where Pasted

> **Where have you pasted your seed phrase or private key?**

| Option | Outcome |
|--------|---------|
| Into a website or app | → Diagnosis: Phishing / Fake Site |
| Into a code file or .env file | → Diagnosis: Exposed in Code |
| Between different wallet apps | → Diagnosis: Clipboard Compromise |
| Other | Continue to A5 |

---

#### A5: Downloaded Files

> **Have you downloaded any files or installed any software recently?**

| Option | Next |
|--------|------|
| Yes | A5a: File Type |
| No | A6: Wallet Setup |
| I don't remember | A6: Wallet Setup |

---

#### A5a: File Type

> **What type of file or software was it?**

| Option | Next |
|--------|------|
| Application or software (.exe, .dmg, installer) | A5b: Source |
| Document (PDF, Word, Excel) | A5b: Source |
| Browser extension | → Diagnosis: Malicious Extension |
| Script or code file | A5b: Source |
| I don't remember | A5b: Source |

---

#### A5b: File Source

> **Where did you get this file?**

| Option | Diagnosis |
|--------|-----------|
| Discord or Telegram (someone sent it) | → Diagnosis: Social Engineering File |
| Email attachment | → Diagnosis: Phishing Email |
| Downloaded from a website | → Diagnosis: Malicious Download |
| Job application or freelance work | → Diagnosis: Fake Job Scam |
| Other | Continue to A6 |

---

#### A6: Wallet Setup

> **Did someone help you set up your wallet, or did you buy/receive this wallet from someone?**

| Option | Outcome |
|--------|---------|
| Someone helped me set it up | → Diagnosis: Compromised Setup |
| I bought or received this wallet | → Diagnosis: Purchased Wallet Scam |
| No, I set it up myself | A7: Physical Access |

---

#### A7: Physical Access (Fallback)

*Only reached if other paths don't identify the cause*

> **Who has physical access to where you store your seed phrase?**

| Option | Next |
|--------|------|
| Only me | A8: Final Fallback |
| Family members | Follow-up questions about trust/access |
| Roommates or others | → Possible Diagnosis: Physical Theft |

---

#### A8: Final Fallback

> **We weren't able to pinpoint exactly how this happened, but the most common causes are:**
>
> - Seed phrase stored digitally somewhere you may have forgotten
> - Clipboard malware capturing copy/paste
> - A malicious site or app you don't remember interacting with
>
> **The good news:** You can still protect yourself going forward.
>
> [Learn Best Practices] [Visit HackedWalletRecovery.com]

---

### Path B: Malicious Transaction (Active Use)

User was actively using wallet when drain occurred.

#### B1: How Found Site

> **How did you find the site or app you were using?**

| Option | Diagnosis Modifier |
|--------|-------------------|
| Link from social media (Twitter/X, Discord, Telegram) | Social Media Scam context |
| Google search | SEO/Sponsored Scam context |
| Someone DM'd me the link | DM Scam context |
| Email | Phishing Email context |
| I typed the URL directly or used a bookmark | Typosquatting context OR legitimate site (needs more investigation) |

---

#### B2: Transaction Type

> **What were you trying to do?**
>
> (This helps us understand the attack pattern)

| Option |
|--------|
| Claiming an airdrop |
| Minting an NFT |
| Connecting to a new dApp |
| Approving a token transaction |
| Something else |

*All options lead to the same core diagnosis (Malicious Transaction) but with tailored educational content.*

---

→ **Diagnosis: Malicious Transaction** (with context from B1 and B2)

---

## Wallet-Specific Variations

### Browser Extension Wallets
Additional questions/considerations:
- Weak wallet password risk
- Copy/paste habits more common
- Malicious extension risk
- Computer malware risk (keyloggers, clipboard hijackers)

### Mobile Wallets
Additional questions/considerations:
- Malicious app permissions (especially Android)
- Copy/paste between apps
- Generally safer if no malicious apps installed

### Hardware Wallets
Narrower path - only a few ways to compromise:
- Seed phrase storage (same as others)
- Signed malicious transaction (requires physical confirmation)
- Entered seed phrase into fake "firmware update" site
- Bought hardware wallet from unofficial source (pre-compromised)

Additional question:
> **Did you buy your hardware wallet directly from the manufacturer or an authorized retailer?**

| Option | Outcome |
|--------|---------|
| Yes, directly from manufacturer | Continue normal path |
| No, from Amazon/eBay/secondhand | → Diagnosis: Compromised Hardware |

---

## Diagnoses (End States)

Each diagnosis includes:
1. **Authoritative statement** of what likely happened
2. **Explanation** of how the attack works (high-level, not technical)
3. **Empathetic acknowledgment** that this is common
4. **Action items** for protecting themselves going forward
5. **Links** to Learn section and HackedWalletRecovery.com

### Diagnosis: Cloud Storage

> **Your seed phrase was likely stolen from cloud storage.**
>
> When you store your seed phrase in Google Drive, iCloud, Dropbox, or similar services, anyone who compromises your cloud account has full access to your wallet. Hackers specifically target cloud accounts knowing that people store sensitive information there.
>
> This happens to a lot of people. You're not alone, and now you know better.
>
> **Protect yourself going forward:**
> - Create a brand new wallet with a fresh seed phrase
> - Write it down on paper or metal - never store it digitally
> - Keep it somewhere physically secure that only you can access
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Phone Storage (Screenshot/Photo)

> **Your seed phrase was likely stolen from your phone.**
>
> Screenshots and photos are automatically backed up to cloud services, synced across devices, and accessible to apps with photo permissions. Hackers know this and specifically look for seed phrase photos.
>
> Many people make this mistake thinking it's a quick, convenient backup. Unfortunately, it's one of the easiest ways to lose your funds.
>
> **Protect yourself going forward:**
> - Delete any photos of seed phrases from your phone AND cloud backups
> - Create a brand new wallet with a fresh seed phrase
> - Write it down on paper or metal only
> - Store it somewhere physically secure
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Digital Storage (Notes/Text File)

> **Your seed phrase was likely stolen from a file on your computer.**
>
> Text files, notes apps, and documents on your computer can be accessed by malware, synced to cloud services without you realizing, or found if someone gains access to your machine. Hackers use automated tools to scan computers for anything that looks like a seed phrase.
>
> This is an easy mistake to make. Now you know to do better.
>
> **Protect yourself going forward:**
> - Delete any digital copies of seed phrases
> - Create a brand new wallet with a fresh seed phrase
> - Write it down on paper or metal only
> - Never store seed phrases on any digital device
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Password Reuse

> **Your wallet was likely compromised through password reuse.**
>
> When you use the same password across multiple sites, a breach on any one of those sites exposes all your accounts. Hackers buy leaked password databases and automatically try those credentials everywhere - including password managers and crypto-related services.
>
> This is extremely common. Billions of passwords have been leaked over the years.
>
> **Protect yourself going forward:**
> - Check if your passwords have been leaked: [haveibeenpwned.com](https://haveibeenpwned.com)
> - Use a unique, randomly-generated password for every account
> - Use a reputable password manager with a very strong master password
> - Enable 2FA everywhere possible (preferably not SMS-based)
> - Create a brand new wallet with a fresh seed phrase
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Phishing / Fake Site

> **You likely entered your seed phrase into a fake website.**
>
> Scammers create convincing copies of legitimate wallet sites, exchanges, and dApps. They use similar domain names, identical designs, and urgent messaging to trick you into entering your seed phrase. The moment you enter it, they have full access to your wallet.
>
> No legitimate service will ever ask for your seed phrase. Ever.
>
> **Protect yourself going forward:**
> - Never enter your seed phrase into any website
> - Bookmark official sites and only use those bookmarks
> - Be extremely suspicious of any site asking for your seed phrase
> - Create a brand new wallet with a fresh seed phrase
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Exposed in Code

> **Your private key or seed phrase was likely exposed in code or configuration files.**
>
> Developers sometimes paste private keys into .env files, config files, or code during development. If this code is ever pushed to GitHub, shared with others, or your computer is compromised, that key is exposed. Hackers actively scan public repositories and compromised machines for exposed keys.
>
> This is a common mistake, especially for developers new to crypto.
>
> **Protect yourself going forward:**
> - Never put real private keys in code, even temporarily
> - Use hardware wallets or separate development wallets for testing
> - Add sensitive files to .gitignore before creating them
> - Assume any key that touched a code file is compromised
> - Create a brand new wallet for real funds
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Clipboard Compromise

> **Your seed phrase or private key was likely stolen via clipboard.**
>
> When you copy your seed phrase, it sits in your clipboard where malware can read it. Some malware specifically monitors for crypto-related data being copied. Other malware even replaces wallet addresses in your clipboard with the attacker's address.
>
> If you've ever copied and pasted your seed phrase, especially on a computer that might have malware, consider it compromised.
>
> **Protect yourself going forward:**
> - Never copy/paste seed phrases or private keys
> - Run antivirus/malware scans on your devices
> - Create a brand new wallet with a fresh seed phrase
> - Type seed phrases manually when absolutely necessary
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Social Engineering File (Discord/Telegram)

> **You likely installed malware sent to you on Discord or Telegram.**
>
> Scammers pose as friendly community members, potential business partners, or even "support staff" and send files that contain malware. This malware can steal seed phrases, monitor your clipboard, or take control of your browser extensions.
>
> This is one of the most common attack vectors in crypto. The person who sent you that file was not who they claimed to be.
>
> **Protect yourself going forward:**
> - Never download files from people you don't know personally
> - Be suspicious even of files from "friends" (their accounts may be compromised)
> - Assume anyone offering unsolicited help is a scammer
> - Run antivirus scans and consider reinstalling your OS
> - Create a brand new wallet on a clean device
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Phishing Email

> **You likely opened a malicious email attachment.**
>
> Phishing emails often contain attachments disguised as invoices, documents, or important files. These can install malware that steals your seed phrase, logs your keystrokes, or monitors your crypto activity.
>
> Email phishing has been around for decades, and crypto users are now prime targets.
>
> **Protect yourself going forward:**
> - Never open attachments from unknown senders
> - Be suspicious of unexpected attachments, even from known contacts
> - Verify with the sender through a different channel if unsure
> - Run antivirus scans and consider reinstalling your OS
> - Create a brand new wallet on a clean device
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Malicious Download

> **You likely downloaded malware from a website.**
>
> Fake download sites, compromised legitimate sites, and malicious ads can all serve malware disguised as legitimate software. This malware then steals your seed phrase, monitors your activity, or takes control of your wallet.
>
> Always verify you're downloading from official sources.
>
> **Protect yourself going forward:**
> - Only download software from official websites
> - Verify URLs carefully before downloading anything
> - Be suspicious of "cracked" or free versions of paid software
> - Run antivirus scans and consider reinstalling your OS
> - Create a brand new wallet on a clean device
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Fake Job Scam

> **You were targeted by a fake job or freelance scam.**
>
> Scammers pose as recruiters or clients and send "test projects," "onboarding documents," or "required software" that contains malware. This is an increasingly common attack targeting developers and freelancers in the crypto space.
>
> The job offer was never real. It was a sophisticated social engineering attack.
>
> **Protect yourself going forward:**
> - Research companies thoroughly before opening any files
> - Never run code or install software from unknown sources
> - Be suspicious of unsolicited job offers, especially in DMs
> - Use virtual machines for reviewing suspicious projects
> - Run antivirus scans and consider reinstalling your OS
> - Create a brand new wallet on a clean device
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Malicious Extension

> **You likely installed a malicious browser extension.**
>
> Fake wallet extensions, compromised extensions, or extensions with excessive permissions can steal your seed phrase, modify transactions, or inject malicious code into websites you visit.
>
> Browser extensions have significant access to your browser activity.
>
> **Protect yourself going forward:**
> - Only install extensions from official sources
> - Verify extension publishers carefully
> - Regularly review and remove extensions you don't use
> - Use a separate browser profile for crypto activities
> - Create a brand new wallet after removing suspicious extensions
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Compromised Setup

> **The person who helped set up your wallet may have kept your seed phrase.**
>
> When someone else sees your seed phrase - even someone you trust - they have full access to your wallet forever. They may have written it down, photographed it, or memorized it.
>
> Unfortunately, even well-meaning helpers can later decide to steal funds, or their own security practices may expose your seed phrase.
>
> **Protect yourself going forward:**
> - Always set up wallets yourself, in private
> - Never let anyone else see your seed phrase
> - Your seed phrase is yours alone - no exceptions
> - Create a brand new wallet that only you control
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Purchased Wallet Scam

> **You can't actually buy a wallet. This was a scam.**
>
> When someone "sells" you a wallet with funds in it, they still know the seed phrase. They will always be able to access that wallet. The "stuck funds" or "locked tokens" were bait to get you to pay them.
>
> No free lunch in crypto, just like everywhere else. If something sounds too good to be true, it probably is.
>
> **Protect yourself going forward:**
> - Never buy, accept, or use a wallet someone else created
> - Always create your own wallet from scratch
> - Remember: whoever knows the seed phrase controls the wallet
> - If it seems too good to be true, it is
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Compromised Hardware

> **Your hardware wallet may have been pre-compromised.**
>
> Hardware wallets bought from unofficial sources (Amazon third-party sellers, eBay, secondhand) may have been tampered with. Scammers buy devices, extract or pre-generate seed phrases, then resell them as "new."
>
> Always buy hardware wallets directly from the manufacturer.
>
> **Protect yourself going forward:**
> - Only buy hardware wallets from official manufacturer websites
> - Never use a hardware wallet that came with a pre-filled seed phrase
> - When setting up, the device should generate a new seed phrase
> - Consider your current hardware wallet compromised
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

### Diagnosis: Malicious Transaction

*Context varies based on how they found the site (B1) and what they were doing (B2)*

**Base diagnosis:**

> **You signed a malicious transaction.**
>
> When you connect your wallet to a site and approve a transaction, you're trusting that site to do what it claims. Malicious sites create transactions that look legitimate but actually drain your wallet or grant unlimited access to your tokens.

**Context additions:**

**If found via social media:**
> Scammers constantly post fake opportunities on Twitter, Discord, and Telegram. They create urgency with "limited time" offers and use bot accounts to make things look popular.

**If found via Google:**
> Scammers pay for ads that appear above legitimate search results. They also use SEO techniques to rank fake sites highly. Always verify you're on the official site.

**If found via DM:**
> Anyone who DMs you about a crypto opportunity is almost certainly a scammer. Legitimate projects don't recruit through unsolicited messages. This is one of the most common attack vectors.

**If found via email:**
> Phishing emails impersonate legitimate projects and exchanges. Always navigate to sites directly rather than clicking email links.

**If typed URL directly:**
> You may have made a typo and landed on a lookalike domain (typosquatting), or the legitimate site itself was compromised. Bookmark official sites and use only those bookmarks.

**Action items (all contexts):**

> **Protect yourself going forward:**
> - Revoke token approvals: [revoke.cash](https://revoke.cash)
> - Be extremely skeptical of any "opportunity"
> - Verify sites independently before connecting your wallet
> - Use a separate "hot wallet" with small amounts for risky activities
> - Consider hardware wallets for significant holdings
>
> [Learn Best Practices] [HackedWalletRecovery.com]

---

## Learn Best Practices Section

### Navigation
- Accessible from top nav at all times
- Also linked at end of every diagnosis

### Content Sections

#### 1. Seed Phrase Security

> **Your seed phrase is everything.**
>
> Whoever has your seed phrase has complete control of your wallet. There's no "forgot password" option, no customer support to call, no way to recover funds if someone else gets it.
>
> **The rules are simple:**
> - Write it down on paper or stamp it in metal
> - Store it somewhere physically secure (safe, safety deposit box)
> - Never store it digitally - no photos, no cloud, no notes apps
> - Never share it with anyone, for any reason
> - Never enter it into any website
>
> No legitimate wallet, exchange, or support team will ever ask for your seed phrase. Anyone who does is trying to steal from you.

---

#### 2. Recognizing Scams

> **If it sounds too good to be true, it is.**
>
> Scammers are creative and persistent. Common tactics include:
>
> **Fake airdrops and giveaways**
> "Send 0.1 ETH to receive 1 ETH back" - This is always a scam. Always.
>
> **Urgent opportunities**
> "Mint closes in 10 minutes!" - Artificial urgency is designed to make you act without thinking.
>
> **Unsolicited DMs**
> Anyone messaging you about a crypto opportunity is a scammer. Block and move on.
>
> **"Support" reaching out to you**
> Real support teams don't DM first. If someone claims to be support and contacts you, it's a scam.
>
> **Purchased wallets or "stuck funds"**
> You can't buy a wallet. The seller will always have the seed phrase.
>
> No free lunch in crypto, just like everywhere else.

---

#### 3. Safe Browsing Habits

> **How you navigate matters.**
>
> **Bookmark everything**
> Save official URLs and only use your bookmarks. Never click links from DMs, emails, or social media.
>
> **Verify before connecting**
> Before connecting your wallet to any site, verify you're on the real site. Check the URL character by character.
>
> **Watch out for ads**
> Scammers buy Google ads for fake versions of popular sites. Scroll past ads to organic results, or use your bookmarks.
>
> **Be careful what you download**
> Never download files from strangers. Be suspicious of unexpected attachments. "Test projects" from recruiters are a common attack vector.

---

#### 4. Understanding Approvals

> **Token approvals can drain your wallet.**
>
> When you approve a token on a dApp, you're often giving that contract permission to move your tokens. Malicious contracts ask for unlimited approvals and then drain everything.
>
> **Best practices:**
> - Revoke unused approvals regularly: [revoke.cash](https://revoke.cash)
> - Read what you're signing (or use tools that translate it)
> - Be suspicious of unlimited approval requests
> - Use a separate wallet for risky activities

---

#### 5. The Hot/Cold Wallet Model

> **Don't keep all your eggs in one basket.**
>
> Think of wallets like bank accounts:
>
> **Hot wallet (checking account)**
> - Browser extension or mobile wallet
> - Connected to the internet
> - Used for daily transactions
> - Keep only what you're willing to lose
>
> **Cold wallet (savings account)**
> - Hardware wallet or multisig
> - Rarely connected to anything
> - Used for long-term storage
> - Holds the majority of your funds
>
> Even if your hot wallet gets compromised, your cold storage stays safe.

---

#### 6. Multisig: The Gold Standard

> **For serious security, use a multisig.**
>
> A multisig (multi-signature) wallet requires multiple approvals to send funds. For example, a "2-of-3" multisig needs 2 out of 3 designated signers to approve any transaction.
>
> **Why this matters:**
> - No single point of failure
> - Even if one key is compromised, funds are safe
> - Protects against physical theft, hacks, and mistakes
>
> **How to set one up:**
> [Safe](https://safe.global) (formerly Gnosis Safe) is the most trusted multisig solution. You can use hardware wallets as your signers for maximum security.
>
> **Recommended setup for significant holdings:**
> - 2-of-3 multisig
> - Each signer on a separate hardware wallet
> - Store each hardware wallet + seed phrase in different secure locations

---

#### 7. What To Do After Being Hacked

> **Immediate steps:**
>
> 1. **Stop using the compromised wallet**
>    It's gone. Accept this and move on to protecting what you can.
>
> 2. **Check for remaining assets**
>    If you have tokens that haven't been stolen yet, you may be able to rescue them using [HackedWalletRecovery.com](https://hackedwalletrecovery.com).
>
> 3. **Scan your devices**
>    Run antivirus and malware scans. If you downloaded something suspicious, consider reinstalling your OS.
>
> 4. **Create a new wallet**
>    Generate a completely new seed phrase on a clean device. Don't reuse anything from the compromised setup.
>
> 5. **Secure the new wallet properly**
>    Apply everything you learned. Write down the seed phrase, store it securely offline, never share it.
>
> 6. **Revoke approvals on other wallets**
>    If you used the same habits on other wallets, check and revoke suspicious approvals at [revoke.cash](https://revoke.cash).

---

#### 8. Security Checklist

> **Your crypto security checklist:**
>
> - [ ] Seed phrase written on paper or metal (never digital)
> - [ ] Seed phrase stored in a physically secure location
> - [ ] Using a separate hot wallet for risky activities
> - [ ] Significant holdings in cold storage (hardware wallet or multisig)
> - [ ] Unique, strong passwords for every account
> - [ ] Official sites bookmarked and only accessed via bookmarks
> - [ ] Browser extensions from official sources only
> - [ ] Token approvals reviewed and revoked regularly
> - [ ] Healthy skepticism of every "opportunity"

---

## Data Model

### Session Data (Anonymous)

```
Session {
  id: UUID
  user_hash: Hash(IP + User Agent)  // For identifying repeat visitors
  created_at: Timestamp
  wallet_type: Enum(browser_extension, mobile, hardware, other)
  wallet_specific: String (e.g., "metamask", "ledger")
  value_range: Enum(under_100, 100_1000, 1000_10000, 10000_100000, over_100000, prefer_not_to_say)
}
```

### Path Data

```
PathAttempt {
  id: UUID
  session_id: FK -> Session
  attempt_number: Integer  // 1st, 2nd, 3rd path they tried
  created_at: Timestamp
}

PathStep {
  id: UUID
  path_attempt_id: FK -> PathAttempt
  step_order: Integer
  question_id: String
  answer_selected: String
  created_at: Timestamp
}
```

### Diagnosis Data

```
Diagnosis {
  id: UUID
  path_attempt_id: FK -> PathAttempt
  diagnosis_type: String
  accepted: Boolean  // Did user accept this diagnosis or try another path?
  clicked_learn: Boolean
  clicked_hwr: Boolean
  created_at: Timestamp
}
```

### Analytics Queries Enabled

- Most common diagnosis by wallet type
- Most common diagnosis by value range
- Average number of path attempts before accepting diagnosis
- Drop-off points in the flow
- Learn section engagement
- HackedWalletRecovery click-through rate
- Trends over time

---

## Probability Engine

### Initial Weights (Default)

Each hack vector starts with a base probability that adjusts based on user answers.

| Diagnosis | Base Weight |
|-----------|-------------|
| Cloud Storage | 20% |
| Phone Storage | 15% |
| Digital Storage | 15% |
| Phishing / Fake Site | 12% |
| Social Engineering File | 10% |
| Malicious Transaction | 8% |
| Password Reuse | 5% |
| Clipboard Compromise | 5% |
| Purchased Wallet | 3% |
| Compromised Setup | 3% |
| Other | 4% |

### Weight Adjustments

Each answer multiplies the probability of relevant diagnoses:

**Example: Wallet Type = Hardware**
- Malicious Transaction: 2x
- Cloud Storage: 0.7x
- Phone Storage: 0.5x
- Malicious Extension: 0.3x

**Example: Found site via DM**
- Social Engineering: 3x
- Malicious Transaction: 2x

### Path Selection

When a diagnosis is rejected, the system:
1. Marks that diagnosis as unlikely (0.1x weight)
2. Recalculates probabilities
3. Returns to the last decision point on the next most likely path
4. Continues down that path

### Tuning

Initial weights will be adjusted based on actual user data after launch.

---

## Technical Requirements

### Platform
- Web application
- Mobile-first responsive design
- Online only (no offline support needed)

### Hosting
- Standard web hosting
- Database for session/path data
- No user authentication required

### Performance
- Fast load times (mental health app = no frustration)
- Smooth transitions between questions
- Works well on slow mobile connections

### Privacy
- No personally identifiable information collected
- User hash (IP + UA) for repeat visitor identification only
- Data retained indefinitely for analysis
- No cookies consent required (no tracking cookies)

---

## User Stories

### US-001: Welcome Experience
**As a** hacked user visiting the site
**I want to** feel acknowledged and not judged
**So that** I'm comfortable proceeding with the diagnostic

**Acceptance Criteria:**
- Welcome screen displays empathetic messaging
- Clear "Get Started" call to action
- Navigation to Learn section visible

---

### US-002: Wallet Type Selection
**As a** user
**I want to** select my wallet type
**So that** the diagnostic asks relevant questions

**Acceptance Criteria:**
- Four main categories displayed clearly
- Sub-options for specific wallets where relevant
- "Other" option available
- Selection is recorded

---

### US-003: Value Range Collection
**As a** user
**I want to** share how much I lost (optionally)
**So that** the community can understand attack patterns

**Acceptance Criteria:**
- Clear value ranges displayed
- "Prefer not to say" option
- Selection is recorded
- Question feels non-intrusive

---

### US-004: Guided Question Flow
**As a** user
**I want to** answer one question at a time
**So that** I'm not overwhelmed

**Acceptance Criteria:**
- Single question displayed at a time
- Clear answer options
- Smooth transition to next question
- Back navigation available

---

### US-005: Diagnosis Delivery
**As a** user who completed the diagnostic
**I want to** understand what likely happened
**So that** I can learn from it

**Acceptance Criteria:**
- Diagnosis displayed with authority
- Explanation of how the attack works
- Empathetic acknowledgment
- Clear action items
- Links to Learn section and HWR

---

### US-006: Path Rejection
**As a** user who doesn't think the diagnosis is right
**I want to** try another path
**So that** I can find the real cause

**Acceptance Criteria:**
- "This doesn't seem right" option available
- System tracks rejection
- User is taken to next most likely path
- New path starts from appropriate decision point

---

### US-007: Learn Section Access
**As a** user
**I want to** learn security best practices
**So that** I can protect myself going forward

**Acceptance Criteria:**
- Accessible from navigation at all times
- Accessible from diagnosis screens
- All topics covered with clear, non-technical language
- External links to tools (revoke.cash, safe.global, haveibeenpwned.com, hackedwalletrecovery.com)

---

### US-008: Data Collection
**As a** site operator
**I want to** collect anonymous usage data
**So that** I can understand common attack patterns

**Acceptance Criteria:**
- Session data recorded (wallet type, value range)
- Full path recorded for each attempt
- Diagnosis acceptance/rejection recorded
- Click-through to Learn/HWR recorded
- User hash for repeat visitor identification
- No PII collected

---

### US-009: Mobile Experience
**As a** mobile user
**I want to** use the site comfortably on my phone
**So that** I can get help immediately

**Acceptance Criteria:**
- Mobile-first design
- Touch-friendly buttons
- Readable text without zooming
- Fast load times on mobile networks

---

### US-010: HackedWalletRecovery Integration
**As a** user with remaining assets at risk
**I want to** know about recovery options
**So that** I can save what's left

**Acceptance Criteria:**
- HWR mentioned as sister project
- Link to HWR on all diagnosis screens
- Clear explanation of what HWR does
- Click tracked for analytics

---

## Out of Scope (v1)

- Admin dashboard
- User accounts/authentication
- Multi-language support
- Share your story feature
- Community statistics display
- Email newsletter
- On-chain wallet analysis
- Direct integration with HWR

---

## Open Questions

1. **Domain**: Final domain TBD
2. **Branding**: Logo, color palette, typography TBD
3. **Tech Stack**: To be determined based on developer preference
4. **Hosting**: To be determined

---

## Appendix: Message Analysis Summary

Key patterns from `messages.md` conversations:

| Pattern | Frequency | Example |
|---------|-----------|---------|
| Sweeper bot draining ETH | High | "any amount of ETH sent to this wallet gets drained" |
| Purchased compromised wallet | Medium | "I paid like 5% of the total amt" for wallet |
| 7702 delegation attacks | Medium | "upgraded to smart contract wallet by hacker" |
| USDT blacklisting | Low | Tether froze funds after detecting hack |
| PulseChain-specific | Low | Different chain considerations |
| Rugged tokens | Low | Token value stolen by project owner |
| NFT recovery needs | Low | 600 NFTs at risk |

Key insights:
- Most users don't know how they were hacked
- Purchased wallet scam is surprisingly common
- Users often return to try multiple paths
- Empathetic, patient guidance is appreciated
- Direct referral to @seal_911_bot for complex cases
