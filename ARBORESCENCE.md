# 🔧 GaragistePro — Arborescence complète (93 fichiers · ~6 700 lignes)

## Stack : Next.js 14 · TypeScript · Prisma · PostgreSQL · Clerk · Stripe · Tailwind CSS

```
garagistepro/
│
├── .env.example                      # Variables d'environnement (template)
├── .eslintrc.json                    # Config ESLint
├── .gitignore
├── .dockerignore
│
├── Dockerfile                        # Multi-stage build (deps → build → prod)
├── docker-compose.yml                # PostgreSQL + App (dev local ou prod)
├── vercel.json                       # Config déploiement Vercel (région cdg1)
│
├── package.json                      # Scripts: dev, build, test, seed, migrate
├── tsconfig.json
├── next.config.js                    # output: "standalone" pour Docker
├── tailwind.config.ts                # Design tokens (couleurs, fonts)
├── postcss.config.js
├── components.json                   # Config shadcn/ui
├── vitest.config.ts                  # Config tests unitaires
├── README.md                         # Documentation complète (install, deploy, API)
│
├── prisma/
│   ├── schema.prisma                 # 7 modèles (Business, Service, Booking, Hours…)
│   ├── seed.ts                       # 3 garages, 12 services, 6 bookings réalistes
│   └── migrations/
│       └── 0001_init/
│           └── migration.sql         # Migration initiale complète
│
├── tests/                            # 5 fichiers de tests Vitest
│   ├── validations.test.ts           # Zod schemas (booking, business, service, hours)
│   ├── date-utils.test.ts            # formatPrice, formatDuration, timezone, slots
│   ├── api-utils.test.ts             # Réponses API (200, 401, 404, 409)
│   ├── seo.test.ts                   # JSON-LD, slugs, metadata
│   └── feature-flags.test.ts         # Feature toggles (payments, vehicle lookup)
│
└── src/
    │
    ├── middleware.ts                  # Clerk — protège /dashboard/*
    │
    ├── lib/                          # ═══ UTILITAIRES PARTAGÉS ═══
    │   ├── prisma.ts                 # Singleton Prisma Client
    │   ├── validations.ts            # Zod schemas (booking, business, service, hours)
    │   ├── api-utils.ts              # apiSuccess(), apiError(), handleApiError()
    │   ├── api-client.ts             # Fetch helpers côté client (get, post, patch, del)
    │   ├── date-utils.ts             # formatPrice, formatDuration, timezone, slot helpers
    │   ├── seo.ts                    # buildMetadata(), buildGarageJsonLd(), slugs
    │   ├── types.ts                  # Types TypeScript partagés front/back
    │   ├── feature-flags.ts          # Feature toggles (payments, vehicle lookup)
    │   └── utils.ts                  # cn() — classnames merge Tailwind
    │
    ├── services/                     # ═══ BUSINESS LOGIC (BACK-END) ═══
    │   ├── business.service.ts       # CRUD garage + RBAC assertOwner() + hours
    │   ├── service.service.ts        # CRUD prestations + reorder + categories
    │   ├── slot.service.ts           # Algo créneaux 30min · timezone-aware
    │   ├── booking.service.ts        # Anti-double booking (SERIALIZABLE transaction)
    │   ├── stripe.service.ts         # PaymentIntent, webhook, refund
    │   ├── email.service.ts          # Brevo transactionnel (confirmation, rappel)
    │   └── vehicle.service.ts        # Lookup plaque immatriculation (feature flag)
    │
    ├── components/                   # ═══ COMPOSANTS REACT ═══
    │   ├── ui/                       # shadcn/ui
    │   │   ├── button.tsx            # Button (7 variants × 5 sizes)
    │   │   ├── card.tsx              # Card, CardHeader, CardContent, CardFooter
    │   │   └── forms.tsx             # Input, Textarea, Label, Badge, Separator
    │   ├── layout/
    │   │   ├── header.tsx            # Navigation publique + Clerk auth
    │   │   └── footer.tsx            # Footer 4 colonnes + légal
    │   └── shared/
    │       ├── search-form.tsx       # Recherche ville + prestation
    │       ├── ui-helpers.tsx        # Spinner, EmptyState, StatusBadge, PriceTag
    │       └── cookie-banner.tsx     # Bandeau RGPD
    │
    └── app/                          # ═══ NEXT.JS APP ROUTER ═══
        │
        ├── layout.tsx                # Root layout (Clerk, fonts, cookie banner)
        ├── globals.css               # Tailwind base + CSS variables design system
        ├── loading.tsx               # Spinner global
        ├── not-found.tsx             # Page 404 custom
        │
        ├── sign-in/[[...sign-in]]/page.tsx     # Clerk Sign In
        ├── sign-up/[[...sign-up]]/page.tsx     # Clerk Sign Up
        │
        │── (public)/                 # ─── PAGES PUBLIQUES (SSR/SSG + SEO) ───
        │   ├── layout.tsx            #   Header + Footer wrapper
        │   ├── page.tsx              #   Homepage (hero, recherche, stats, villes, CTA pro)
        │   ├── garages/
        │   │   ├── page.tsx          #   Recherche garages (?city=&service=)
        │   │   └── [city]/page.tsx   #   Listing par ville (generateStaticParams)
        │   ├── garage/
        │   │   └── [slug]/page.tsx   #   Fiche garage (JSON-LD AutoRepair, services, horaires)
        │   ├── prestation/
        │   │   └── [serviceCity]/page.tsx  # SEO: vidange-lyon, freins-paris
        │   ├── [city]/
        │   │   └── [service]/page.tsx     # SEO: /lyon/vidange
        │   ├── privacy/page.tsx      #   Politique de confidentialité (RGPD)
        │   └── terms/page.tsx        #   CGU
        │
        ├── booking/                  # ─── TUNNEL DE RÉSERVATION ───
        │   ├── layout.tsx            #   Header only
        │   └── page.tsx              #   Wizard 4 étapes (prestation → créneau → véhicule → confirmation)
        │
        ├── dashboard/                # ─── ESPACE GARAGISTE (protégé Clerk) ───
        │   ├── layout.tsx            #   Sidebar navigation + topbar
        │   ├── page.tsx              #   Accueil: stats, dernières réservations
        │   ├── bookings/page.tsx     #   Liste réservations + filtres + actions statut
        │   ├── planning/page.tsx     #   Vue semaine navigable (6 jours)
        │   ├── services/page.tsx     #   CRUD prestations (ajout/modif/désactivation)
        │   ├── hours/page.tsx        #   Horaires hebdo + exceptions dates
        │   ├── settings/page.tsx     #   Infos garage + lien page publique
        │   └── onboarding/page.tsx   #   Création garage (première connexion)
        │
        └── api/                      # ─── ROUTES API (thin handlers → services) ───
            │
            ├── garages/              # Public
            │   ├── route.ts          #   GET — recherche garages
            │   ├── [slug]/route.ts   #   GET — détail garage par slug
            │   └── cities/route.ts   #   GET — villes distinctes
            ├── slots/route.ts        #   GET — créneaux disponibles
            ├── bookings/route.ts     #   POST — créer réservation
            ├── vehicle/route.ts      #   GET — lookup plaque
            ├── services/
            │   └── categories/route.ts  # GET — catégories distinctes
            │
            ├── my/                   # Client connecté
            │   └── bookings/
            │       ├── route.ts      #   GET — mes réservations
            │       └── [id]/route.ts #   POST — annuler ma réservation
            │
            ├── dashboard/            # Pro (auth Clerk + assertOwner)
            │   ├── business/route.ts #   GET/POST/PATCH — mon garage
            │   ├── services/
            │   │   ├── route.ts      #   GET/POST — prestations
            │   │   └── [id]/route.ts #   PATCH/DELETE — modifier/supprimer
            │   ├── hours/route.ts    #   PUT — horaires hebdo (bulk)
            │   ├── exceptions/
            │   │   ├── route.ts      #   POST — ajouter exception
            │   │   └── [id]/route.ts #   DELETE — supprimer exception
            │   ├── bookings/
            │   │   ├── route.ts      #   GET — réservations garage (filtrées)
            │   │   └── [id]/route.ts #   PATCH — changer statut
            │   └── planning/route.ts #   GET — planning semaine
            │
            └── webhooks/
                └── stripe/route.ts   #   POST — événements Stripe
```

---

## 🚀 Pour mettre en ligne — Checklist CTO

### Prérequis comptes externes

| Service | Usage | Obligatoire |
|---------|-------|:-----------:|
| **Clerk** (clerk.com) | Authentification utilisateurs | ✅ |
| **PostgreSQL** (Railway / Supabase / Neon) | Base de données | ✅ |
| **Vercel** ou **VPS/Docker** | Hébergement Next.js | ✅ |
| **Stripe** (stripe.com) | Paiement en ligne | ❌ (feature flag) |
| **Brevo** (brevo.com) | Emails transactionnels | ❌ (fail-safe) |
| **Sentry** (sentry.io) | Monitoring erreurs | ❌ |

### Option A — Vercel + Railway (recommandé, le plus rapide)

```bash
# 1. BDD → Railway (railway.app)
#    Créer un projet → Add PostgreSQL → copier DATABASE_URL

# 2. App → Vercel
npm i -g vercel
vercel                               # Follow prompts, link to Git repo

# 3. Variables d'environnement (dashboard Vercel → Settings → Environment Variables)
DATABASE_URL=                         # Railway PostgreSQL URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=    # Clerk dashboard
CLERK_SECRET_KEY=                     # Clerk dashboard
NEXT_PUBLIC_APP_URL=                  # https://votre-domaine.vercel.app
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/onboarding

# 4. Migrations
npx prisma migrate deploy

# 5. Seed initial (optionnel, données démo)
npx prisma db seed

# 6. Stripe webhook (si paiement activé)
#    Stripe Dashboard → Webhooks → Add endpoint → https://votre-domaine/api/webhooks/stripe
```

### Option B — Docker (VPS / cloud)

```bash
# 1. Copier le .env.example → .env et remplir les variables
cp .env.example .env

# 2. Lancer PostgreSQL + App
docker-compose up -d

# 3. Appliquer les migrations
docker-compose exec app npx prisma migrate deploy

# 4. Seed (optionnel)
docker-compose exec app npx prisma db seed
```

### Commandes utiles post-déploiement

```bash
npm run build              # Build production
npm test                   # Lancer les 5 fichiers de tests
npx prisma studio          # Interface graphique BDD
npx prisma migrate deploy  # Appliquer migrations en prod
npx prisma db seed         # Charger données de démo
```

### Points d'attention sécurité

- Le middleware Clerk protège toutes les routes `/dashboard/*`
- Chaque service backend vérifie `clerkUserId === business.ownerId` (RBAC)
- Anti-double booking via transaction PostgreSQL `SERIALIZABLE`
- Webhook Stripe vérifie la signature cryptographique
- Toutes les entrées validées via Zod (front + back)
- Paiements et lookup véhicule désactivables par feature flag
