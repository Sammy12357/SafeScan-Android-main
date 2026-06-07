// Convert an exported Solana private key (base58, e.g. from Phantom/Solflare)
// into a Solana keypair JSON file (publisher.json) for the dApp Store CLI.
//
// SAFE USAGE (the key never leaves your machine):
//   1. Paste your exported base58 private key into:  dapp-store/SECRET_KEY.txt
//   2. From the project root run:                    node dapp-store/import-key.mjs
//   3. Confirm the printed public key matches your expected wallet.
//   4. DELETE dapp-store/SECRET_KEY.txt afterwards.
//
// SECRET_KEY.txt and publisher.json are git-ignored (see dapp-store/.gitignore).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bs58 from "bs58";
import nacl from "tweetnacl";

const here = path.dirname(fileURLToPath(import.meta.url));
const secretPath = path.join(here, "SECRET_KEY.txt");
const outPath = path.join(here, "publisher.json");

// The public key your publisher.address is set to in config.yaml.
const EXPECTED_PUBKEY = "45aqg6KfRYGnXnzBfdDBgPjN6KLLuJpsrbmRfFKy6NB1";

if (!fs.existsSync(secretPath)) {
  console.error(`\nMissing ${secretPath}`);
  console.error("Paste your exported base58 private key into that file, then re-run.\n");
  process.exit(1);
}

const raw = fs.readFileSync(secretPath, "utf8").trim();
if (!raw) {
  console.error("SECRET_KEY.txt is empty.");
  process.exit(1);
}

let decoded;
try {
  decoded = bs58.decode(raw);
} catch (e) {
  console.error("Could not base58-decode the key. Make sure you pasted the base58 secret key (not a seed phrase).");
  process.exit(1);
}

let secretKey; // 64-byte ed25519 secret key
if (decoded.length === 64) {
  secretKey = Uint8Array.from(decoded);
} else if (decoded.length === 32) {
  // 32-byte seed -> derive full keypair
  secretKey = nacl.sign.keyPair.fromSeed(Uint8Array.from(decoded)).secretKey;
} else {
  console.error(`Unexpected key length: ${decoded.length} bytes (expected 64 or 32).`);
  process.exit(1);
}

const pubkey = bs58.encode(secretKey.slice(32, 64));
console.log("\nDerived public key:", pubkey);

if (pubkey !== EXPECTED_PUBKEY) {
  console.error("\n*** MISMATCH ***");
  console.error("Expected:", EXPECTED_PUBKEY);
  console.error("Got:     ", pubkey);
  console.error("This key is NOT the publisher wallet in config.yaml. publisher.json was NOT written.");
  console.error("Either export the correct wallet, or update publisher.address in config.yaml to match.\n");
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(Array.from(secretKey)));
console.log("Match! Wrote", outPath);
console.log("\nNext: DELETE dapp-store/SECRET_KEY.txt, then back up publisher.json offline.\n");
