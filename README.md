# 🔧 GaragistePro — Plateforme de réservation garage auto

> SaaS de réservation en ligne pour garages automobiles.  
> Stack : Next.js 14 · TypeScript · Prisma · PostgreSQL · Clerk · Stripe · Tailwind

---

## 📋 Prérequis

| Outil | Version min. |
|-------|-------------|
| Node.js | 18+ |
| npm / pnpm | 9+ / 8+ |
| PostgreSQL | 15+ |
| Git | 2.30+ |

Comptes nécessaires :
- **Clerk** (auth) → [clerk.com](https://clerk.com)
- **Stripe** (paiements, optionnel) → [stripe.com](https://stripe.com)
- **Brevo** (emails transactionnels, optionnel) → [brevo.com](https://brevo.com)

---

## 🚀 Installation locale

### 1. Cloner et installer

```bash
git clone <repo-url> garagistepro
cd garagistepro
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Remplir au minimum :

```env
# Base de données (obligatoire)
DATABASE_URL="postgresql://user:password@localhost:5432/garagistepro"

# Clerk (obligatoire)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/onboarding"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Base de données

```bash
# Créer la BDD et appliquer les migrations
npx prisma migrate dev

# Charger les données de démo
npx prisma db seed
```

### 4. Lancer

```bash
npm run dev
```

→ http://localhost:3000

---

## 🏗 Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Pages publiques (SSR/SSG + SEO)
│   │   ├── page.tsx        # Homepage + hero + recherche
│   │   ├── garages/        # Recherche + listing par ville
│   │   ├── garage/[slug]/  # Fiche garage (JSON-LD)
│   │   ├── prestation/     # SEO prestation+ville
│   │   └── [city]/[svc]    # SEO ville+prestation
│   ├── booking/            # Tunnel de réservation (wizard 4 étapes)
│   ├── dashboard/          # Espace garagiste (protégé Clerk)
│   │   ├── page.tsx        # Accueil stats
│   │   ├── bookings/       # Gestion réservations
│   │   ├── planning/       # Vue semaine
│   │   ├── services/       # CRUD prestations
│   │   ├── hours/          # Horaires + exceptions
│   │   ├── settings/       # Paramètres garage
│   │   └── onboarding/     # Création garage
│   └── api/                # Routes API (thin handlers)
│       ├── garages/        # Public: recherche, détail
│       ├── slots/          # Créneaux disponibles
│       ├── bookings/       # Création réservation
│       ├── vehicle/        # Lookup plaque
│       ├── my/bookings/    # Réservations client
│       ├── dashboard/      # Routes pro (protégées)
│       └── webhooks/stripe # Webhook Stripe
├── services/               # Business logic (aucune logique dans les routes)
│   ├── booking.service     # Anti-double booking SERIALIZABLE
│   ├── business.service    # CRUD + RBAC assertOwner()
│   ├── slot.service        # Algo créneaux 30min, timezone
│   ├── stripe.service      # PaymentIntent, webhook, refund
│   ├── email.service       # Brevo transactionnel
│   ├── service.service     # CRUD prestations
│   └── vehicle.service     # API plaque (feature flag)
├── components/
│   ├── ui/                 # shadcn/ui (Button, Card, Input…)
│   ├── layout/             # Header, Footer
│   └── shared/             # SearchForm, StatusBadge, Helpers
├── lib/                    # Utilitaires
│   ├── prisma.ts           # Singleton Prisma
│   ├── validations.ts      # Zod schemas
│   ├── date-utils.ts       # Slots, timezone, formatage FR
│   ├── api-utils.ts        # Réponses standardisées
│   ├── api-client.ts       # Fetch helpers côté client
│   ├── seo.ts              # Metadata + JSON-LD
│   ├── types.ts            # TypeScript partagé
│   └── feature-flags.ts    # Feature toggles
└── middleware.ts            # Clerk auth (protège /dashboard)
```

### Principes clés

- **Business logic dans `/services`** — les routes API sont des thin wrappers
- **Anti-double booking** — transaction `SERIALIZABLE` + `SELECT FOR UPDATE`
- **RBAC** — `assertOwner()` vérifie `business.clerkUserId === userId`
- **Timezone-aware** — stockage UTC, affichage `Europe/Paris`
- **Zod partout** — validation front + back
- **Feature flags** — paiements et lookup véhicule désactivables

---

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

Tests couverts : validations Zod, date-utils, API helpers, SEO, feature flags.

---

## 📦 Déploiement

### Option A : Vercel + Railway (recommandé)

**1. Base de données → Railway**

```bash
# Sur railway.app, créer un projet PostgreSQL
# Copier la DATABASE_URL fournie
```

**2. Application → Vercel**

```bash
npm i -g vercel
vercel

# Configurer les variables d'environnement dans le dashboard Vercel :
# DATABASE_URL, CLERK_*, STRIPE_*, BREVO_*, NEXT_PUBLIC_APP_URL
```

**3. Migrations en production**

```bash
npx prisma migrate deploy
```

**4. Seed initial (optionnel)**

```bash
npx prisma db seed
```

### Option B : Docker

```bash
# Build et lancer
docker-compose up -d

# Appliquer migrations
docker-compose exec app npx prisma migrate deploy

# Seed
docker-compose exec app npx prisma db seed
```

### Option C : VPS (PM2)

```bash
npm run build
pm2 start npm --name garagistepro -- start
```

---

## 🔑 Variables d'environnement

| Variable | Obligatoire | Description |
|----------|:-----------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL publique de l'app |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe public key |
| `BREVO_API_KEY` | ❌ | Brevo API key |
| `BREVO_SENDER_EMAIL` | ❌ | Email expéditeur |
| `BREVO_SENDER_NAME` | ❌ | Nom expéditeur |
| `VEHICLE_LOOKUP_API_URL` | ❌ | API recherche plaque |
| `VEHICLE_LOOKUP_API_KEY` | ❌ | Clé API plaque |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | ❌ | `"true"` pour activer Stripe |
| `NEXT_PUBLIC_VEHICLE_LOOKUP_ENABLED` | ❌ | `"true"` pour activer lookup plaque |
| `SENTRY_DSN` | ❌ | DSN Sentry pour monitoring |

---

## 📜 Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre en mode développement |
| `npm run build` | Build production |
| `npm start` | Démarre le build production |
| `npm test` | Lance les tests Vitest |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec couverture |
| `npm run lint` | Lint ESLint |
| `npx prisma studio` | Interface graphique BDD |
| `npx prisma migrate dev` | Nouvelle migration |
| `npx prisma db seed` | Charger données de démo |

---

## 📡 Endpoints API

### Public
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/garages?city=&service=` | Recherche garages |
| GET | `/api/garages/cities` | Villes distinctes |
| GET | `/api/garages/[slug]` | Détail garage |
| GET | `/api/slots?businessId=&serviceId=&date=` | Créneaux disponibles |
| GET | `/api/services/categories` | Catégories |
| GET | `/api/vehicle?plate=` | Lookup plaque |
| POST | `/api/bookings` | Créer réservation |

### Client connecté
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/my/bookings` | Mes réservations |
| POST | `/api/my/bookings/[id]` | Annuler ma réservation |

### Dashboard pro (auth requise)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST/PATCH | `/api/dashboard/business` | Mon garage |
| GET/POST | `/api/dashboard/services` | Prestations |
| PATCH/DELETE | `/api/dashboard/services/[id]` | Modifier/supprimer prestation |
| PUT | `/api/dashboard/hours` | Horaires hebdo |
| POST | `/api/dashboard/exceptions` | Exception horaire |
| DELETE | `/api/dashboard/exceptions/[id]` | Supprimer exception |
| GET | `/api/dashboard/bookings` | Réservations garage |
| PATCH | `/api/dashboard/bookings/[id]` | Modifier statut |
| GET | `/api/dashboard/planning` | Planning semaine |

### Webhook
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/webhooks/stripe` | Événements Stripe |

---

## 🛡 Sécurité

- **RBAC** : chaque route dashboard vérifie `clerkUserId === business.ownerId`
- **Anti-double booking** : transaction PostgreSQL SERIALIZABLE
- **Zod** : validation stricte sur tous les inputs
- **Clerk** : middleware protège `/dashboard/*`
- **Stripe webhook** : vérification signature
- **RGPD** : cookie banner, page privacy, données minimales

---

## 📄 Licence

Propriétaire — Tous droits réservés.
