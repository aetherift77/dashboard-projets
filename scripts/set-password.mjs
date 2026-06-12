#!/usr/bin/env node
// scripts/set-password.mjs
// Génère AUTH_SECRET + le hash scrypt du mot de passe, puis les écrit dans .env.local.
// Le mot de passe n'est jamais stocké en clair.
//
// Usage :   node scripts/set-password.mjs "monMotDePasse"
//
// Pense ensuite à reporter AUTH_SECRET et DASHBOARD_PASSWORD_HASH dans les
// variables d'environnement Vercel (Project Settings → Environment Variables).

import { scryptSync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error(
    'Usage : node scripts/set-password.mjs "<motdepasse>"  (8 caractères minimum)'
  );
  process.exit(1);
}

const KEYLEN = 64;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEYLEN);

const passwordHash = `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
const authSecret = randomBytes(48).toString("base64url");

const envPath = resolve(process.cwd(), ".env.local");
let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

function upsert(src, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(src)) return src.replace(re, line);
  return src.replace(/\s*$/, "") + `\n${line}\n`;
}

content = upsert(content, "AUTH_SECRET", authSecret);
content = upsert(content, "DASHBOARD_PASSWORD_HASH", passwordHash);
// On supprime un éventuel mot de passe en clair désormais inutile.
content = content.replace(/^DASHBOARD_PASSWORD=.*$\n?/m, "");

writeFileSync(envPath, content, "utf8");

console.log("✅ .env.local mis à jour : AUTH_SECRET + DASHBOARD_PASSWORD_HASH.");
console.log(
  "ℹ️  Redémarre `next dev` pour recharger les variables d'environnement."
);
console.log(
  "⚠️  Sur Vercel, ajoute AUTH_SECRET et DASHBOARD_PASSWORD_HASH dans les Environment Variables du projet."
);
