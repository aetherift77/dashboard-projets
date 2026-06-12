#!/usr/bin/env node
// Génère une paire de clés VAPID pour le Web Push.
// Prérequis : npm install web-push
// Usage : node scripts/gen-vapid.mjs
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("# ── Clés VAPID — à coller dans .env.local ET dans Vercel (Environment Variables) ──");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log("# Définis aussi :");
console.log("VAPID_SUBJECT=mailto:remi.furgaut@yahoo.com");
console.log("# CRON_SECRET=<chaîne aléatoire, ex: openssl rand -base64 32>");
