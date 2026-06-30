import type { DiagnosisType } from '@/lib/probability';
import type { TopicId } from '@/content/learn-topics';

export interface DiagnosisPage {
  slug: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  howItWorks: string[];
  warningSigns: string[];
  relatedLearn: TopicId[];
  relatedDiagnoses: DiagnosisType[];
}

export interface DiagnosisContent {
  title: string;
  mainCopy: string[];
  empathy: string;
  actionItems: string[];
  externalLinks?: { label: string; url: string }[];
  page?: DiagnosisPage;
}

// All diagnosis content per PRD. Consumed by both the diagnostic result screen
// (DiagnosisScreen) and the /how/<slug> explainer pages.
export const DIAGNOSES: Record<DiagnosisType, DiagnosisContent> = {
  cloud_storage: {
    page: {
      slug: 'seed-phrase-in-cloud-storage',
      h1: 'Your seed phrase was stolen from cloud storage',
      seoTitle: 'Seed Phrase Stolen From Cloud Storage (iCloud, Drive)',
      seoDescription:
        'If you saved your seed phrase in iCloud, Google Drive, or Dropbox, a breach of that account hands over your wallet. Here’s how it happens and what to do.',
      howItWorks: [
        'Cloud accounts are a single, high-value target. If your seed phrase lives in iCloud, Google Drive, Dropbox, OneDrive, or a notes app that syncs to the cloud, then anyone who gets into that account gets your wallet, with no malware on your devices required.',
        'Attackers get in through reused or leaked passwords, SIM-swap-driven password resets, or phishing of the cloud login itself. Once inside, automated tools scan files and photos for 12- or 24-word phrases, private keys, and keystore files.',
        "Because the theft happens on the attacker's machine, your own phone and computer look completely normal, which is why this often goes unnoticed until the funds move.",
      ],
      warningSigns: [
        'Your seed phrase, or a photo of it, was ever saved to a cloud-synced location.',
        'You reuse the password on that cloud account, or it has appeared in a breach.',
        "The cloud account doesn't have strong, app-based two-factor authentication.",
        'Funds left with no suspicious activity on your own devices.',
      ],
      relatedLearn: ['seed-phrase', 'checklist'],
      relatedDiagnoses: ['phone_storage', 'digital_storage', 'password_reuse'],
    },
    title: 'Your seed phrase was likely stolen from cloud storage.',
    mainCopy: [
      'When you store your seed phrase in Google Drive, iCloud, Dropbox, or similar services, anyone who compromises your cloud account has full access to your wallet. Hackers specifically target cloud accounts knowing that people store sensitive information there.',
    ],
    empathy: "This happens to a lot of people. You're not alone, and now you know better.",
    actionItems: [
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal - never store it digitally',
      'Keep it somewhere physically secure that only you can access',
    ],
  },
  phone_storage: {
    page: {
      slug: 'seed-phrase-on-your-phone',
      h1: 'Your seed phrase was stolen from your phone',
      seoTitle: 'Seed Phrase Photo on Your Phone? How It Gets Stolen',
      seoDescription:
        'Screenshots and photos of a seed phrase sync to the cloud and are readable by apps with photo access. Here’s how phones leak recovery phrases and what to do.',
      howItWorks: [
        "Taking a screenshot or photo of your seed phrase feels convenient, but that image doesn't stay on your phone. It's backed up to iCloud or Google Photos, synced across your devices, and readable by any app you've granted photo-library access.",
        "Malicious apps (and even some 'cleaner' or 'wallpaper' apps) scan the photo library for images that look like recovery sheets. Optical character recognition turns a photo of your phrase into plain text in seconds.",
        'A lost or stolen unlocked phone, or the cloud photo backup itself, exposes the phrase the same way.',
      ],
      warningSigns: [
        'You have a photo or screenshot of your seed phrase in your camera roll.',
        'You installed apps that requested photo-library access without an obvious need.',
        'Your photos back up to iCloud or Google Photos (they almost certainly do).',
      ],
      relatedLearn: ['seed-phrase', 'checklist'],
      relatedDiagnoses: ['cloud_storage', 'digital_storage', 'malicious_extension'],
    },
    title: 'Your seed phrase was likely stolen from your phone.',
    mainCopy: [
      'Screenshots and photos are automatically backed up to cloud services, synced across devices, and accessible to apps with photo permissions. Hackers know this and specifically look for seed phrase photos.',
      'Many people make this mistake thinking it\'s a quick, convenient backup. Unfortunately, it\'s one of the easiest ways to lose your funds.',
    ],
    empathy: '',
    actionItems: [
      'Delete any photos of seed phrases from your phone AND cloud backups',
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal only',
      'Store it somewhere physically secure',
    ],
  },
  digital_storage: {
    page: {
      slug: 'seed-phrase-in-a-file',
      h1: 'Your seed phrase was stolen from a file on your computer',
      seoTitle: "Seed Phrase Saved in a File? Why That's Dangerous",
      seoDescription:
        'A seed phrase in a text file, notes app, or document can be read by malware or synced to the cloud. Here’s how it gets stolen and how to recover safely.',
      howItWorks: [
        'A seed phrase saved in a text file, a notes app, a password-manager note, or a document sits in plaintext on a networked machine. Info-stealer malware, bundled with cracked software, fake installers, and malicious attachments, searches your disk for files and wallet data that look like keys or recovery phrases.',
        'Many notes and document apps also sync silently to the cloud, so the file may exist in more places than you realize, each one a separate way in.',
        'Stealers exfiltrate quietly in the background; the first sign is usually the funds leaving.',
      ],
      warningSigns: [
        'Your phrase or private key is in any file, note, or document on a computer.',
        "You've installed software from unofficial or 'cracked' sources.",
        'The file syncs to a cloud service you may have forgotten about.',
      ],
      relatedLearn: ['seed-phrase', 'checklist'],
      relatedDiagnoses: ['cloud_storage', 'clipboard_compromise', 'malicious_download'],
    },
    title: 'Your seed phrase was likely stolen from a file on your computer.',
    mainCopy: [
      'Text files, notes apps, and documents on your computer can be accessed by malware, synced to cloud services without you realizing, or found if someone gains access to your machine. Hackers use automated tools to scan computers for anything that looks like a seed phrase.',
    ],
    empathy: 'This is an easy mistake to make. Now you know to do better.',
    actionItems: [
      'Delete any digital copies of seed phrases',
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal only',
      'Never store seed phrases on any digital device',
    ],
  },
  password_reuse: {
    page: {
      slug: 'password-reuse',
      h1: 'Your wallet was compromised through password reuse',
      seoTitle: 'Password Reuse and Crypto Theft: How It Happens',
      seoDescription:
        'Reused passwords let attackers into the email, cloud, or exchange accounts that guard your crypto. Learn how credential stuffing leads to drained wallets.',
      howItWorks: [
        "Billions of username and password pairs have leaked in past breaches. Attackers load these into automated tools and 'stuff' them across thousands of sites: email, cloud storage, exchanges, password managers. If you reused a password anywhere that protects your crypto, one old breach unlocks it.",
        'The wallet itself is rarely cracked directly. Instead the reused password opens the email or cloud account that holds your seed-phrase backup, or the exchange account that holds your funds, and the rest follows.',
      ],
      warningSigns: [
        'You use the same or similar passwords across multiple sites.',
        'Your email appears in a known breach (check haveibeenpwned.com).',
        "An exchange or email account showed a login you don't recognize.",
        'Two-factor authentication on your critical accounts is SMS-based or off.',
      ],
      relatedLearn: ['checklist', 'seed-phrase'],
      relatedDiagnoses: ['cloud_storage', 'phishing_fake_site'],
    },
    title: 'Your wallet was likely compromised through password reuse.',
    mainCopy: [
      'When you use the same password across multiple sites, a breach on any one of those sites exposes all your accounts. Hackers buy leaked password databases and automatically try those credentials everywhere - including password managers and crypto-related services.',
      'This is extremely common. Billions of passwords have been leaked over the years.',
    ],
    empathy: '',
    actionItems: [
      'Use a unique, randomly-generated password for every account',
      'Use a reputable password manager with a very strong master password',
      'Enable 2FA everywhere possible (preferably not SMS-based)',
      'Create a brand new wallet with a fresh seed phrase',
    ],
    externalLinks: [
      { label: 'Check if your passwords have been leaked', url: 'https://haveibeenpwned.com' },
    ],
  },
  phishing_fake_site: {
    page: {
      slug: 'fake-website-phishing',
      h1: 'You entered your seed phrase into a fake website',
      seoTitle: 'Fake Wallet Website Phishing: Seed Phrase Stolen',
      seoDescription:
        'Fake wallet, exchange, and dApp sites trick you into entering your seed phrase or “validating” your wallet. Here’s how to spot them and what to do now.',
      howItWorks: [
        'Phishing sites are pixel-perfect clones of real wallet, exchange, and dApp pages, served from lookalike domains (a swapped letter, an extra word, a different ending) and often promoted through paid search ads or DMs.',
        "The fake site invents a reason you must enter your secret: 'validate your wallet,' 'sync your account,' 'claim your airdrop,' or 'recover stuck funds.' The instant your 12 or 24 words or private key hit that page, the attacker imports your wallet and drains it.",
        'No legitimate service ever asks for your seed phrase. Entering it anywhere online is the moment of compromise.',
      ],
      warningSigns: [
        'You typed or pasted your seed phrase into a website or popup.',
        'You reached the site from an ad, DM, email link, or search result.',
        'The domain was subtly misspelled or used the wrong ending (.com vs .app).',
        "The site pushed urgency or 'verification' to get your phrase.",
      ],
      relatedLearn: ['browsing', 'scams', 'seed-phrase'],
      relatedDiagnoses: ['phishing_email', 'malicious_transaction', 'malicious_extension'],
    },
    title: 'You likely entered your seed phrase into a fake website.',
    mainCopy: [
      'Scammers create convincing copies of legitimate wallet sites, exchanges, and dApps. They use similar domain names, identical designs, and urgent messaging to trick you into entering your seed phrase. The moment you enter it, they have full access to your wallet.',
      'No legitimate service will ever ask for your seed phrase. Ever.',
    ],
    empathy: '',
    actionItems: [
      'Never enter your seed phrase into any website',
      'Bookmark official sites and only use those bookmarks',
      'Be extremely suspicious of any site asking for your seed phrase',
      'Create a brand new wallet with a fresh seed phrase',
    ],
  },
  exposed_in_code: {
    page: {
      slug: 'private-key-in-code',
      h1: 'Your private key was exposed in code or config',
      seoTitle: 'Private Key Leaked in Code or .env? What Happens',
      seoDescription:
        'Private keys pasted into .env files, code, or commits get scraped from GitHub and infected machines within minutes. Here’s how it happens and what to do.',
      howItWorks: [
        "Developers often paste a private key or mnemonic into a .env file, a config, or a script 'just for testing.' If that ever reaches a GitHub repo, it's gone. Bots scan new commits for key patterns continuously and sweep funds within minutes.",
        'Keys also leak through committed .env files, shared gists, CI logs, screen shares, and info-stealer malware that reads project folders.',
        'Any key that has touched a code file or a developer machine should be treated as permanently public.',
      ],
      warningSigns: [
        'A real private key or seed phrase was ever placed in code, a .env, or config.',
        'That file may have been committed, pushed, shared, or logged.',
        "Funds left an address you'd used for development or testing.",
      ],
      relatedLearn: ['seed-phrase', 'hot-cold'],
      relatedDiagnoses: ['digital_storage', 'clipboard_compromise'],
    },
    title: 'Your private key or seed phrase was likely exposed in code or configuration files.',
    mainCopy: [
      'Developers sometimes paste private keys into .env files, config files, or code during development. If this code is ever pushed to GitHub, shared with others, or your computer is compromised, that key is exposed. Hackers actively scan public repositories and compromised machines for exposed keys.',
    ],
    empathy: 'This is a common mistake, especially for developers new to crypto.',
    actionItems: [
      'Never put real private keys in code, even temporarily',
      'Use hardware wallets or separate development wallets for testing',
      'Add sensitive files to .gitignore before creating them',
      'Assume any key that touched a code file is compromised',
      'Create a brand new wallet for real funds',
    ],
  },
  clipboard_compromise: {
    page: {
      slug: 'clipboard-malware',
      h1: 'Your wallet was compromised by clipboard malware',
      seoTitle: 'Clipboard Malware: Stolen Keys & Swapped Addresses',
      seoDescription:
        'Clipboard malware reads what you copy (including seed phrases) and silently swaps pasted wallet addresses for the attacker’s. Here’s how to recover.',
      howItWorks: [
        'When you copy a seed phrase or private key, it sits in your clipboard in plaintext, where any running program can read it. Info-stealers specifically watch the clipboard for crypto-looking data.',
        "A nastier variant, a clipboard hijacker, watches for wallet addresses and silently replaces what you paste with the attacker's. You copy a friend's address, paste it, and the transaction goes to the thief instead. The swap is easy to miss because the address looks similar at a glance.",
        'Both run quietly in the background, usually arriving with a malicious download or attachment.',
      ],
      warningSigns: [
        'You copied and pasted your seed phrase or private key on that machine.',
        "A pasted address didn't match what you copied, or funds went to an unknown address.",
        'You recently installed software from an unofficial source.',
      ],
      relatedLearn: ['seed-phrase', 'signing'],
      relatedDiagnoses: ['malicious_download', 'digital_storage', 'social_engineering_file'],
    },
    title: 'Your seed phrase or private key was likely stolen via clipboard.',
    mainCopy: [
      'When you copy your seed phrase, it sits in your clipboard where malware can read it. Some malware specifically monitors for crypto-related data being copied. Other malware even replaces wallet addresses in your clipboard with the attacker\'s address.',
      'If you\'ve ever copied and pasted your seed phrase, especially on a computer that might have malware, consider it compromised.',
    ],
    empathy: '',
    actionItems: [
      'Never copy/paste seed phrases or private keys',
      'Run antivirus/malware scans on your devices',
      'Create a brand new wallet with a fresh seed phrase',
      'Type seed phrases manually when absolutely necessary',
    ],
  },
  social_engineering_file: {
    page: {
      slug: 'malware-from-discord-or-telegram',
      h1: 'You installed malware sent on Discord or Telegram',
      seoTitle: 'Malware From Discord/Telegram Drained My Wallet',
      seoDescription:
        'Scammers on Discord and Telegram pose as friends, partners, or support and send files that steal your wallet. Here’s how the attack works and what to do.',
      howItWorks: [
        "Someone friendly (a 'collab partner,' a 'project team,' a 'support agent,' or a compromised friend's account) sends you a file: a game build to test, a PDF, a 'bot,' or an installer. Opening or running it installs an info-stealer that harvests seed phrases, browser wallet data, and clipboard contents.",
        'The social setup is the point: trust and a plausible reason lower your guard before the payload ever runs. The sender was never who they claimed to be, or their account was hijacked.',
      ],
      warningSigns: [
        'You downloaded or ran a file someone sent you on Discord or Telegram.',
        'The opportunity, job, or collaboration came through an unsolicited DM.',
        "You were asked to disable antivirus or 'allow' a security warning.",
      ],
      relatedLearn: ['scams', 'browsing', 'after-hacked'],
      relatedDiagnoses: ['fake_job_scam', 'malicious_download', 'phishing_email'],
    },
    title: 'You likely installed malware sent to you on Discord or Telegram.',
    mainCopy: [
      'Scammers pose as friendly community members, potential business partners, or even "support staff" and send files that contain malware. This malware can steal seed phrases, monitor your clipboard, or take control of your browser extensions.',
      'This is one of the most common attack vectors in crypto. The person who sent you that file was not who they claimed to be.',
    ],
    empathy: '',
    actionItems: [
      'Never download files from people you don\'t know personally',
      'Be suspicious even of files from "friends" (their accounts may be compromised)',
      'Assume anyone offering unsolicited help is a scammer',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  phishing_email: {
    page: {
      slug: 'phishing-email-attachment',
      h1: 'You opened a malicious email attachment',
      seoTitle: 'Phishing Email Attachment Drained My Wallet?',
      seoDescription:
        'A malicious email attachment can install malware that steals seed phrases and keystrokes. Here’s how email phishing targets crypto users and what to do.',
      howItWorks: [
        "Phishing emails carry attachments dressed up as invoices, shipping notices, resumes, or 'important documents.' Opening the file (especially enabling macros in a document, or running an executable) installs malware that logs keystrokes and steals wallet data and saved credentials.",
        'The email may spoof a brand, an exchange, or even a contact whose account was compromised, which is why the attachment feels expected.',
      ],
      warningSigns: [
        "You opened or 'enabled content' on an unexpected attachment.",
        'The email created urgency or impersonated a service or contact.',
        'Funds or credentials were compromised after handling that email.',
      ],
      relatedLearn: ['browsing', 'scams', 'after-hacked'],
      relatedDiagnoses: ['social_engineering_file', 'malicious_download', 'phishing_fake_site'],
    },
    title: 'You likely opened a malicious email attachment.',
    mainCopy: [
      'Phishing emails often contain attachments disguised as invoices, documents, or important files. These can install malware that steals your seed phrase, logs your keystrokes, or monitors your crypto activity.',
      'Email phishing has been around for decades, and crypto users are now prime targets.',
    ],
    empathy: '',
    actionItems: [
      'Never open attachments from unknown senders',
      'Be suspicious of unexpected attachments, even from known contacts',
      'Verify with the sender through a different channel if unsure',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  malicious_download: {
    page: {
      slug: 'malicious-download',
      h1: 'You downloaded malware from a website',
      seoTitle: 'Malicious Download: Fake App Drained My Crypto',
      seoDescription:
        'Fake download sites, malicious ads, and “cracked” software install info-stealers that harvest wallets. Here’s how it happens and how to recover safely.',
      howItWorks: [
        "Fake download pages, malvertising (malicious search ads), and 'cracked' or 'free' versions of paid software serve installers laced with info-stealer malware. The app may even work as advertised while the bundled stealer harvests seed phrases, browser-extension wallet data, and saved passwords in the background.",
        'Fake versions of popular wallets and crypto tools are a favorite lure, often ranking via ads above the real site.',
      ],
      warningSigns: [
        'You installed software from a link in an ad, search result, or DM.',
        "You used a 'cracked,' 'modded,' or free copy of paid software.",
        'The download came from a site that was not the official source.',
      ],
      relatedLearn: ['browsing', 'hot-cold', 'after-hacked'],
      relatedDiagnoses: ['malicious_extension', 'social_engineering_file', 'clipboard_compromise'],
    },
    title: 'You likely downloaded malware from a website.',
    mainCopy: [
      'Fake download sites, compromised legitimate sites, and malicious ads can all serve malware disguised as legitimate software. This malware then steals your seed phrase, monitors your activity, or takes control of your wallet.',
      'Always verify you\'re downloading from official sources.',
    ],
    empathy: '',
    actionItems: [
      'Only download software from official websites',
      'Verify URLs carefully before downloading anything',
      'Be suspicious of "cracked" or free versions of paid software',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  fake_job_scam: {
    page: {
      slug: 'fake-job-scam',
      h1: 'You were hit by a fake job or freelance scam',
      seoTitle: "Fake Job Scam: Crypto Stolen via 'Test Project'",
      seoDescription:
        'Fake recruiters send “test projects” or “onboarding software” laced with malware that steals wallets. Here’s how the fake job scam works and what to do.',
      howItWorks: [
        "A 'recruiter' or 'client' offers an attractive role and asks you to run a take-home task: clone a repo and run it, install 'required' software, or open an onboarding document. The code or file contains malware that steals your seed phrase, browser wallet data, and credentials.",
        'These campaigns are well-resourced and patient: fake company sites, profiles, and interviews, all aimed at developers and others likely to hold crypto. The job was never real.',
      ],
      warningSigns: [
        'An unsolicited job or collaboration led you to run code or install software.',
        "You were rushed to complete a 'test task' or onboarding step.",
        'You were asked to disable security warnings or antivirus to proceed.',
      ],
      relatedLearn: ['scams', 'browsing', 'after-hacked'],
      relatedDiagnoses: ['social_engineering_file', 'malicious_download', 'exposed_in_code'],
    },
    title: 'You were targeted by a fake job or freelance scam.',
    mainCopy: [
      'Scammers pose as recruiters or clients and send "test projects," "onboarding documents," or "required software" that contains malware. This is an increasingly common attack targeting developers and freelancers in the crypto space.',
      'The job offer was never real. It was a sophisticated social engineering attack.',
    ],
    empathy: '',
    actionItems: [
      'Research companies thoroughly before opening any files',
      'Never run code or install software from unknown sources',
      'Be suspicious of unsolicited job offers, especially in DMs',
      'Use virtual machines for reviewing suspicious projects',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  malicious_extension: {
    page: {
      slug: 'malicious-browser-extension',
      h1: 'A malicious browser extension drained your wallet',
      seoTitle: 'Malicious Browser Extension Stole My Crypto',
      seoDescription:
        'Fake or compromised browser extensions can read pages, swap addresses, and steal seed phrases. Here’s how malicious extensions attack wallets and what to do.',
      howItWorks: [
        'Browser extensions can be granted permission to read and change everything on the pages you visit. A fake wallet extension, a compromised legitimate one, or an over-permissioned utility can capture your seed phrase as you type it, alter transaction details before you sign, or swap addresses shown on the page.',
        'Fake wallet extensions in web stores, and legitimate extensions that get sold or hijacked and pushed as a malicious update, are both common.',
      ],
      warningSigns: [
        'You installed a wallet or crypto extension from outside the official source.',
        "Transaction details or addresses on a site didn't match what you expected.",
        "You have extensions with broad permissions you don't recognize or use.",
      ],
      relatedLearn: ['browsing', 'signing', 'approvals'],
      relatedDiagnoses: ['malicious_download', 'phishing_fake_site', 'malicious_transaction'],
    },
    title: 'You likely installed a malicious browser extension.',
    mainCopy: [
      'Fake wallet extensions, compromised extensions, or extensions with excessive permissions can steal your seed phrase, modify transactions, or inject malicious code into websites you visit.',
      'Browser extensions have significant access to your browser activity.',
    ],
    empathy: '',
    actionItems: [
      'Only install extensions from official sources',
      'Verify extension publishers carefully',
      'Regularly review and remove extensions you don\'t use',
      'Use a separate browser profile for crypto activities',
      'Create a brand new wallet after removing suspicious extensions',
    ],
  },
  compromised_setup: {
    page: {
      slug: 'someone-else-set-up-your-wallet',
      h1: 'Someone who set up your wallet kept your seed phrase',
      seoTitle: 'Someone Set Up My Wallet, Then Drained It',
      seoDescription:
        'If anyone else saw or set up your seed phrase, they can access your wallet forever. Here’s why “helped” setups get drained and how to recover control.',
      howItWorks: [
        'Whoever has seen your seed phrase controls your wallet, permanently. When someone else sets it up for you, or you set it up where they can watch, they may write it down, photograph it, or simply remember enough of it.',
        "This includes well-meaning friends and family, 'helpful' strangers, and anyone in a tech-support or 'wallet recovery' role. Their own poor security can also expose the phrase later, even if they never intended harm.",
      ],
      warningSigns: [
        'Someone else created your wallet or watched you write the phrase down.',
        'You received a wallet that was already set up, with a phrase provided.',
        'Anyone could have photographed or copied the phrase during setup.',
      ],
      relatedLearn: ['seed-phrase', 'multisig'],
      relatedDiagnoses: ['purchased_wallet_scam', 'compromised_hardware'],
    },
    title: 'The person who helped set up your wallet may have kept your seed phrase.',
    mainCopy: [
      'When someone else sees your seed phrase - even someone you trust - they have full access to your wallet forever. They may have written it down, photographed it, or memorized it.',
      'Unfortunately, even well-meaning helpers can later decide to steal funds, or their own security practices may expose your seed phrase.',
    ],
    empathy: '',
    actionItems: [
      'Always set up wallets yourself, in private',
      'Never let anyone else see your seed phrase',
      'Your seed phrase is yours alone - no exceptions',
      'Create a brand new wallet that only you control',
    ],
  },
  purchased_wallet_scam: {
    page: {
      slug: 'pre-loaded-wallet-scam',
      h1: "You bought a 'pre-loaded' wallet: it was a scam",
      seoTitle: "Pre-Loaded Wallet Scam: Why 'Stuck Funds' Vanish",
      seoDescription:
        'You can’t buy a wallet with funds in it. The seller always keeps the seed phrase. Here’s how the pre-loaded wallet scam works and what to do.',
      howItWorks: [
        "The pitch: someone 'sells' you a wallet that already holds tokens, or shares a seed phrase to a wallet with 'stuck' funds you can claim once you pay fees or gas. But whoever generated that wallet still has the seed phrase forever.",
        'The visible balance is bait. The moment you deposit gas or funds to move the stuck tokens, an automated sweeper controlled by the seller instantly takes it. You can never out-run the person who holds the keys.',
      ],
      warningSigns: [
        'You were given a seed phrase to a wallet that already had a balance.',
        "You were told to deposit gas or fees to unlock or claim 'stuck' funds.",
        'The wallet was bought, gifted, or shared by someone else.',
      ],
      relatedLearn: ['scams', 'seed-phrase'],
      relatedDiagnoses: ['compromised_setup', 'phishing_fake_site'],
    },
    title: "You can't actually buy a wallet. This was a scam.",
    mainCopy: [
      'When someone "sells" you a wallet with funds in it, they still know the seed phrase. They will always be able to access that wallet. The "stuck funds" or "locked tokens" were bait to get you to pay them.',
      'No free lunch in crypto, just like everywhere else. If something sounds too good to be true, it probably is.',
    ],
    empathy: '',
    actionItems: [
      'Never buy, accept, or use a wallet someone else created',
      'Always create your own wallet from scratch',
      'Remember: whoever knows the seed phrase controls the wallet',
      'If it seems too good to be true, it is',
    ],
  },
  compromised_hardware: {
    page: {
      slug: 'tampered-hardware-wallet',
      h1: 'Your hardware wallet may have been pre-compromised',
      seoTitle: 'Tampered Hardware Wallet: Bought the Wrong Place',
      seoDescription:
        'Hardware wallets from third-party sellers can arrive pre-set-up with a known seed phrase. Here’s how it happens and how to set one up safely.',
      howItWorks: [
        'A genuine hardware wallet generates a brand-new seed phrase on first setup that only you ever see. Devices bought from Amazon third-party sellers, eBay, or other resellers can arrive pre-initialized with a phrase the seller already knows. Some even ship with a "use this PIN and recovery sheet" card.',
        'Once you fund a wallet whose phrase someone else generated, they can drain it whenever they like. Tampered packaging and "replacement" devices sent after a fake security alert are variants of the same trick.',
      ],
      warningSigns: [
        'The device came with a pre-filled recovery sheet or a preset PIN.',
        'You bought it second-hand or from a third-party marketplace seller.',
        "Setup didn't have you generate and write down a fresh phrase yourself.",
      ],
      relatedLearn: ['hot-cold', 'seed-phrase', 'multisig'],
      relatedDiagnoses: ['compromised_setup', 'purchased_wallet_scam'],
    },
    title: 'Your hardware wallet may have been pre-compromised.',
    mainCopy: [
      'Hardware wallets bought from unofficial sources (Amazon third-party sellers, eBay, secondhand) may have been tampered with. Scammers buy devices, extract or pre-generate seed phrases, then resell them as "new."',
      'Always buy hardware wallets directly from the manufacturer.',
    ],
    empathy: '',
    actionItems: [
      'Only buy hardware wallets from official manufacturer websites',
      'Never use a hardware wallet that came with a pre-filled seed phrase',
      'When setting up, the device should generate a new seed phrase',
      'Consider your current hardware wallet compromised',
    ],
  },
  malicious_transaction: {
    page: {
      slug: 'malicious-transaction',
      h1: 'Your wallet was drained by a malicious transaction',
      seoTitle: 'Wallet Drained After Signing? Malicious Transaction',
      seoDescription:
        'If your crypto vanished right after you approved a transaction or token approval, you likely signed a malicious request. Here’s how it works and what to do.',
      howItWorks: [
        "Most drainer attacks don't need your seed phrase at all. They trick you into signing a transaction or token approval that hands the attacker permission to move your assets. Then a bot sweeps them out, often within seconds.",
        'The dangerous signatures usually fall into a few buckets: an ERC-20 approve (or Permit/Permit2) granting an unlimited spending allowance; a setApprovalForAll that signs away an entire NFT collection; or an outright transfer hidden behind a friendly-looking "Claim" or "Connect" button.',
        'Because the website controls what it shows you, the button can say "Claim airdrop" while the actual transaction grants spending rights. The transaction, not the website, is the truth.',
      ],
      warningSigns: [
        "Funds left moments after you clicked 'Confirm,' 'Claim,' or 'Connect' on a site.",
        "You approved a token or signed a message you didn't fully understand.",
        "The site created urgency ('mint closes in 5 minutes,' 'claim before it's gone').",
        "Your wallet asked you to 'blind sign' an unreadable string of data.",
      ],
      relatedLearn: ['approvals', 'signing', 'scams'],
      relatedDiagnoses: ['phishing_fake_site', 'malicious_extension', 'fake_job_scam'],
    },
    title: 'You signed a malicious transaction.',
    mainCopy: [
      'When you connect your wallet to a site and approve a transaction, you\'re trusting that site to do what it claims. Malicious sites create transactions that look legitimate but actually drain your wallet or grant unlimited access to your tokens.',
    ],
    empathy: '',
    actionItems: [
      'Be extremely skeptical of any "opportunity"',
      'Verify sites independently before connecting your wallet',
      'Use a separate "hot wallet" with small amounts for risky activities',
      'Consider hardware wallets for significant holdings',
    ],
    externalLinks: [
      { label: 'Revoke token approvals', url: 'https://revoke.cash' },
    ],
  },
  unknown: {
    title: "We weren't able to pinpoint exactly how this happened.",
    mainCopy: [
      'The most common causes are:',
      '• Seed phrase stored digitally somewhere you may have forgotten',
      '• Clipboard malware capturing copy/paste',
      '• A malicious site or app you don\'t remember interacting with',
    ],
    empathy: 'The good news: You can still protect yourself going forward.',
    actionItems: [
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal - never store it digitally',
      'Keep it somewhere physically secure',
      'Be extremely cautious about sites you connect your wallet to',
    ],
  },
};

// Ordered list of indexable /how pages (excludes `unknown`, which has no `page`).
export const HOW_PAGES = (
  Object.entries(DIAGNOSES) as [DiagnosisType, DiagnosisContent][]
)
  .filter(([, d]) => d.page)
  .map(([type, d]) => ({ type, ...(d.page as DiagnosisPage) }));

export const getDiagnosisBySlug = (slug: string) =>
  HOW_PAGES.find((p) => p.slug === slug);
