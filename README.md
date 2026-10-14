# Dashboard de projets

Application web personnelle pour suivre mes projets, leurs étapes et mon inventaire de matériel, depuis n'importe quel appareil.

Stack : Next.js 16 (App Router), React 19, Tailwind v4, Supabase, déployé sur Vercel.

Fonctionnalités : tableau de projets (édition directe, filtres, tri), kanban en glisser-déposer, gestion des étapes, inventaire, fiche détaillée par projet, connexion par mot de passe, application installable (PWA) et notifications push pour les deadlines.

## Sécurité

- Le site est protégé par un mot de passe unique, avec un cookie de session signé (HMAC) vérifié dans `proxy.ts`.
- Le navigateur n'accède jamais directement à Supabase. Les lectures et écritures passent par la route authentifiée `/api/db`, qui utilise la clé `service_role` côté serveur uniquement.
- RLS est activé sur toutes les tables : la base n'est pas accessible directement avec la clé anon.

Si tu clones ce dépôt, tu branches ta propre base Supabase ; tu n'as pas accès à la mienne.

## Installer sa propre instance

### 1. Cloner + dépendances

```bash
git clone https://github.com/aetherift77/dashboard-projets.git
cd dashboard-projets
npm install
```

### 2. Créer un projet Supabase

Créer un projet sur [supabase.com](https://supabase.com), puis créer les tables du
dashboard dans le SQL Editor : `projets`, `etapes`, `inventaire` et `push_subscriptions`.
Le détail des colonnes se trouve directement dans le code du projet
(`lib/types.ts` et `app/api/db`).

### 3. Activer RLS (verrouiller la base)

Comme l'app accède à la base via `service_role` (qui **contourne** RLS côté serveur),
on peut activer RLS sans aucune policy : tout accès anonyme direct est alors **refusé**.

```sql
ALTER TABLE projets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaire         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Aucune policy = aucun accès via les clés publiques (anon). L'app passe par service_role.
```

### 4. Variables d'environnement

Crée `.env.local` (jamais commité) :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<ton-projet>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<clé service_role, Supabase → Settings → API>
# (la clé anon n'est plus nécessaire pour le fonctionnement)

# Authentification (générées automatiquement, voir ci-dessous)
AUTH_SECRET=...
DASHBOARD_PASSWORD_HASH=...

# Notifications push (optionnel)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_SUBJECT=mailto:toi@exemple.com
CRON_SECRET=<chaîne aléatoire, ex: openssl rand -base64 32>
```

Définis ton mot de passe (génère `AUTH_SECRET` + `DASHBOARD_PASSWORD_HASH`) :

```bash
node scripts/set-password.mjs "monMotDePasse"
```

Pour les notifications push (facultatif) :

```bash
node scripts/gen-vapid.mjs   # copie les clés affichées dans .env.local
```

### 5. Lancer en local

```bash
npm run dev
# http://localhost:3000  → redirige vers /login
```

### 6. Déployer sur Vercel

1. Importe le repo sur [vercel.com](https://vercel.com).
2. Reporte **toutes** les variables de `.env.local` dans Project Settings → Environment Variables.
3. Déploie. Le cron de notifications (`vercel.json`) tourne quotidiennement à 7h UTC.

> Si tu migres une instance existante : déploie d'abord cette version
> (accès via `service_role`) **puis** active RLS. Activer RLS avant le déploiement couperait
> l'ancienne version (qui lit via la clé anon).

## Structure

- `proxy.ts` — protection des routes (cookie de session signé).
- `app/api/db/route.ts` — proxy de données authentifié (service_role).
- `app/api/auth/*` — login / logout (scrypt, rate-limiting).
- `app/api/push/*`, `app/api/cron/*` — abonnement + envoi des notifications push.
- `lib/` — `auth.ts`, `db.ts` (client), `supabaseAdmin.ts` (serveur), `types.ts`.
- `components/` — `Sidebar`, `NotificationBell`, `Badge`, `Modal`, `ProgressBar`.

