# ⚡ Aether Dashboard

Dashboard personnel de gestion de **projets**, **étapes** et **inventaire**.
Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase · déploiement Vercel.

Fonctions : dashboard projets (édition inline, filtres, tri), board Kanban drag & drop,
gestion des étapes, inventaire, page détail projet, **authentification par mot de passe**,
**PWA installable** et **notifications push** de deadlines.

---

## 🔒 Architecture de sécurité (important)

- L'accès au site est protégé par un **mot de passe unique** (cookie de session signé HMAC, via `proxy.ts`).
- **Le navigateur n'accède jamais directement à Supabase.** Toutes les lectures/écritures passent par
  la route authentifiée `/api/db`, qui parle à Supabase avec la clé **`service_role`** (serveur uniquement).
- **RLS est activé** sur toutes les tables → la base est inaccessible en direct via la clé anon.

➡️ En clonant ce repo, tu branches **ta propre** base Supabase : tu n'as aucun accès à celle de l'auteur.

---

## 🚀 Installer sa propre instance

### 1. Cloner + dépendances

```bash
git clone https://github.com/aetherift77/dashboard-projets.git
cd dashboard-projets
npm install
```

### 2. Créer un projet Supabase

Crée un projet sur [supabase.com](https://supabase.com), puis exécute ce SQL
(Dashboard Supabase → SQL Editor) :

```sql
CREATE TABLE projets (
  id_projet    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom          TEXT NOT NULL,
  description  TEXT,
  notes        TEXT,
  localisation TEXT CHECK (localisation IN ('indetermine','maison','apart','autre')) DEFAULT 'indetermine',
  statut       TEXT CHECK (statut IN ('Idée','Definition','Preparation','Production','Operationnel','Maintenance','Abandonne')) NOT NULL,
  priorite     TEXT CHECK (priorite IN ('Low','Medium','High')) NOT NULL,
  date_og      DATE DEFAULT CURRENT_DATE,
  deadline     DATE
);

CREATE TABLE inventaire (
  id_objet     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom          TEXT NOT NULL,
  description  TEXT,
  nb           INT NOT NULL DEFAULT 1,
  localisation TEXT CHECK (localisation IN ('indetermine','maison','apart','autre')) DEFAULT 'indetermine',
  id_projet    BIGINT REFERENCES projets(id_projet) ON DELETE SET NULL
);

CREATE TABLE etapes (
  id_etape      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_projet     BIGINT REFERENCES projets(id_projet) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  description   TEXT,
  statut        TEXT CHECK (statut IN ('todo','en_cours','bloque','termine')) DEFAULT 'todo',
  date_creation DATE DEFAULT CURRENT_DATE,
  deadline      DATE,
  date_fin      DATE
);

CREATE TABLE push_subscriptions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

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

> ⚠️ **Ordre important si tu migres une instance existante** : déploie d'abord cette version
> (accès via `service_role`) **puis** active RLS. Activer RLS avant le déploiement couperait
> l'ancienne version (qui lit via la clé anon).

---

## 🧱 Stack & structure

- `proxy.ts` — protection des routes (cookie de session signé).
- `app/api/db/route.ts` — proxy de données authentifié (service_role).
- `app/api/auth/*` — login / logout (scrypt, rate-limiting).
- `app/api/push/*`, `app/api/cron/*` — abonnement + envoi des notifications push.
- `lib/` — `auth.ts`, `db.ts` (client), `supabaseAdmin.ts` (serveur), `types.ts`.
- `components/` — `Sidebar`, `NotificationBell`, `Badge`, `Modal`, `ProgressBar`.

Construit avec l'assistance de Claude.
