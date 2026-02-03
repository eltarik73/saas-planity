import { PrismaClient, DayOfWeek, BookingStatus } from "@prisma/client";
import { addDays, addMinutes, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────

function futureDate(daysFromNow: number, hour: number, minute = 0): Date {
  const d = addDays(new Date(), daysFromNow);
  return setMinutes(setHours(d, hour), minute);
}

const WEEKDAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

function standardHours(businessId: string) {
  const hours = [];
  for (const day of WEEKDAYS) {
    hours.push({
      businessId,
      dayOfWeek: day,
      openTime: "08:00",
      closeTime: "18:00",
      isClosed: false,
    });
  }
  hours.push({
    businessId,
    dayOfWeek: "SATURDAY" as DayOfWeek,
    openTime: "09:00",
    closeTime: "13:00",
    isClosed: false,
  });
  hours.push({
    businessId,
    dayOfWeek: "SUNDAY" as DayOfWeek,
    openTime: "08:00",
    closeTime: "18:00",
    isClosed: true,
  });
  return hours;
}

// ─── Main Seed ──────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data (in order due to FK constraints)
  await prisma.booking.deleteMany();
  await prisma.businessHoursException.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();

  // ═══════════════════════════════════════════
  // GARAGE 1 — Garage Dupont (Lyon)
  // ═══════════════════════════════════════════
  const garage1 = await prisma.business.create({
    data: {
      clerkUserId: "user_seed_dupont",
      name: "Garage Dupont",
      slug: "garage-dupont-lyon",
      description:
        "Garage multimarque familial depuis 1985. Spécialiste entretien et réparation toutes marques. Devis gratuit, travail soigné.",
      address: "42 rue de la République",
      city: "Lyon",
      postalCode: "69002",
      phone: "04 78 12 34 56",
      email: "contact@garage-dupont.fr",
      latitude: 45.7578,
      longitude: 4.8351,
      timezone: "Europe/Paris",
      isActive: true,
      paymentMode: "DEPOSIT",
      onlinePaymentEnabled: true,
      depositPercent: 30,
      seoTitle: "Garage Dupont Lyon — Entretien auto multimarque",
      seoDescription:
        "Garage auto à Lyon 2e. Vidange, freins, pneus, climatisation. Réservation en ligne, paiement sécurisé.",
    },
  });

  await prisma.businessHours.createMany({
    data: standardHours(garage1.id),
  });

  // Exception: fermé le 1er mai
  await prisma.businessHoursException.create({
    data: {
      businessId: garage1.id,
      date: new Date("2026-05-01"),
      isClosed: true,
      reason: "Fête du travail",
    },
  });

  const services1 = await Promise.all([
    prisma.service.create({
      data: {
        businessId: garage1.id,
        name: "Vidange + filtre à huile",
        category: "Entretien",
        description: "Vidange complète avec remplacement du filtre à huile. Huile 5W30 ou 5W40 selon véhicule.",
        priceCents: 7900,
        durationMin: 60,
        sortOrder: 0,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage1.id,
        name: "Remplacement plaquettes de frein avant",
        category: "Freinage",
        description: "Plaquettes AV toutes marques. Contrôle disques inclus.",
        priceCents: 14900,
        durationMin: 90,
        sortOrder: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage1.id,
        name: "Montage 4 pneus",
        category: "Pneumatiques",
        description: "Montage, équilibrage et géométrie. Pneus non fournis.",
        priceCents: 6000,
        durationMin: 60,
        sortOrder: 2,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage1.id,
        name: "Diagnostic électronique",
        category: "Diagnostic",
        description: "Lecture codes défaut, analyse complète du système électronique.",
        priceCents: 4900,
        durationMin: 30,
        sortOrder: 3,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage1.id,
        name: "Recharge climatisation",
        category: "Climatisation",
        description: "Recharge gaz R134a ou R1234yf. Test d'étanchéité inclus.",
        priceCents: 8900,
        durationMin: 60,
        sortOrder: 4,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage1.id,
        name: "Révision complète",
        category: "Entretien",
        description:
          "Vidange, filtres (huile, air, habitacle), niveaux, contrôle 30 points.",
        priceCents: 19900,
        durationMin: 120,
        sortOrder: 5,
      },
    }),
  ]);

  // Bookings for Garage Dupont
  await prisma.booking.createMany({
    data: [
      {
        businessId: garage1.id,
        serviceId: services1[0].id,
        clerkUserId: "user_seed_client1",
        clientName: "Marie Martin",
        clientEmail: "marie.martin@email.fr",
        clientPhone: "06 12 34 56 78",
        licensePlate: "AB-123-CD",
        vehicleBrand: "Renault",
        vehicleModel: "Clio V",
        vehicleYear: 2021,
        mileage: 45000,
        startTime: futureDate(1, 9, 0),
        endTime: futureDate(1, 10, 0),
        status: "CONFIRMED",
        priceCents: 7900,
        paymentStatus: "PAID",
        depositCents: 2370,
      },
      {
        businessId: garage1.id,
        serviceId: services1[1].id,
        clerkUserId: "user_seed_client2",
        clientName: "Jean Petit",
        clientEmail: "jean.petit@email.fr",
        clientPhone: "06 98 76 54 32",
        licensePlate: "EF-456-GH",
        vehicleBrand: "Peugeot",
        vehicleModel: "308",
        vehicleYear: 2019,
        mileage: 78000,
        startTime: futureDate(1, 14, 0),
        endTime: futureDate(1, 15, 30),
        status: "PENDING",
        priceCents: 14900,
        paymentStatus: "PENDING",
        depositCents: 4470,
        clientNote: "Bruit au freinage depuis 2 semaines.",
      },
      {
        businessId: garage1.id,
        serviceId: services1[5].id,
        clientName: "Sophie Durand",
        clientEmail: "sophie.durand@email.fr",
        licensePlate: "IJ-789-KL",
        vehicleBrand: "Volkswagen",
        vehicleModel: "Golf VII",
        vehicleYear: 2018,
        mileage: 92000,
        startTime: futureDate(2, 8, 0),
        endTime: futureDate(2, 10, 0),
        status: "CONFIRMED",
        priceCents: 19900,
        paymentStatus: "PAID",
        depositCents: 5970,
      },
      {
        businessId: garage1.id,
        serviceId: services1[3].id,
        clientName: "Pierre Lambert",
        clientEmail: "pierre.lambert@email.fr",
        clientPhone: "07 11 22 33 44",
        licensePlate: "MN-012-OP",
        vehicleBrand: "BMW",
        vehicleModel: "Série 3",
        vehicleYear: 2020,
        startTime: futureDate(3, 10, 0),
        endTime: futureDate(3, 10, 30),
        status: "PENDING",
        priceCents: 4900,
        paymentStatus: "PENDING",
        depositCents: 1470,
        clientNote: "Voyant moteur allumé.",
      },
      {
        businessId: garage1.id,
        serviceId: services1[0].id,
        clientName: "Client Terminé",
        clientEmail: "termine@test.fr",
        licensePlate: "ZZ-999-AA",
        vehicleBrand: "Toyota",
        vehicleModel: "Yaris",
        vehicleYear: 2017,
        startTime: addDays(new Date(), -3),
        endTime: addMinutes(addDays(new Date(), -3), 60),
        status: "COMPLETED",
        priceCents: 7900,
        paymentStatus: "PAID",
      },
    ],
  });

  // ═══════════════════════════════════════════
  // GARAGE 2 — AutoService Express (Paris)
  // ═══════════════════════════════════════════
  const garage2 = await prisma.business.create({
    data: {
      clerkUserId: "user_seed_express",
      name: "AutoService Express",
      slug: "autoservice-express-paris",
      description:
        "Centre auto rapide au cœur de Paris. Sans rendez-vous ou réservation en ligne. Interventions express garanties.",
      address: "15 boulevard Voltaire",
      city: "Paris",
      postalCode: "75011",
      phone: "01 43 55 67 89",
      email: "contact@autoservice-express.fr",
      latitude: 48.8606,
      longitude: 2.3708,
      timezone: "Europe/Paris",
      isActive: true,
      paymentMode: "FULL",
      onlinePaymentEnabled: true,
      seoTitle: "AutoService Express Paris 11 — Centre auto rapide",
      seoDescription:
        "Centre auto Paris 11e. Vidange express, pneus, freins. Réservation en ligne, paiement intégral sécurisé.",
    },
  });

  await prisma.businessHours.createMany({
    data: [
      ...WEEKDAYS.map((day) => ({
        businessId: garage2.id,
        dayOfWeek: day,
        openTime: "07:30",
        closeTime: "19:30",
        isClosed: false,
      })),
      {
        businessId: garage2.id,
        dayOfWeek: "SATURDAY" as DayOfWeek,
        openTime: "08:00",
        closeTime: "17:00",
        isClosed: false,
      },
      {
        businessId: garage2.id,
        dayOfWeek: "SUNDAY" as DayOfWeek,
        openTime: "08:00",
        closeTime: "18:00",
        isClosed: true,
      },
    ],
  });

  const services2 = await Promise.all([
    prisma.service.create({
      data: {
        businessId: garage2.id,
        name: "Vidange express",
        category: "Entretien",
        description: "Vidange sans rendez-vous en 30 minutes chrono.",
        priceCents: 5900,
        durationMin: 30,
        sortOrder: 0,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage2.id,
        name: "Contrôle technique",
        category: "Contrôle",
        description: "Contrôle technique officiel agréé. Contre-visite possible sur place.",
        priceCents: 7500,
        durationMin: 60,
        sortOrder: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage2.id,
        name: "Remplacement batterie",
        category: "Électrique",
        description: "Diagnostic + remplacement batterie. Batterie fournie ou non.",
        priceCents: 12900,
        durationMin: 30,
        sortOrder: 2,
      },
    }),
  ]);

  await prisma.booking.createMany({
    data: [
      {
        businessId: garage2.id,
        serviceId: services2[1].id,
        clientName: "Lucie Bernard",
        clientEmail: "lucie.b@email.fr",
        licensePlate: "QR-345-ST",
        vehicleBrand: "Citroën",
        vehicleModel: "C3",
        vehicleYear: 2016,
        mileage: 110000,
        startTime: futureDate(1, 11, 0),
        endTime: futureDate(1, 12, 0),
        status: "CONFIRMED",
        priceCents: 7500,
        paymentStatus: "PAID",
      },
    ],
  });

  // ═══════════════════════════════════════════
  // GARAGE 3 — Mécanique Dubois (Lyon)
  // ═══════════════════════════════════════════
  const garage3 = await prisma.business.create({
    data: {
      clerkUserId: "user_seed_dubois",
      name: "Mécanique Dubois",
      slug: "mecanique-dubois-lyon",
      description:
        "Atelier mécanique indépendant. Spécialiste véhicules allemands (BMW, Audi, Mercedes, VW). Pièces d'origine.",
      address: "8 rue Garibaldi",
      city: "Lyon",
      postalCode: "69003",
      phone: "04 72 33 44 55",
      email: "contact@mecanique-dubois.fr",
      latitude: 45.7602,
      longitude: 4.8495,
      timezone: "Europe/Paris",
      isActive: true,
      paymentMode: "NONE",
      onlinePaymentEnabled: false,
    },
  });

  await prisma.businessHours.createMany({
    data: standardHours(garage3.id),
  });

  await Promise.all([
    prisma.service.create({
      data: {
        businessId: garage3.id,
        name: "Distribution",
        category: "Mécanique lourde",
        description: "Remplacement courroie/chaîne de distribution. Devis sur demande.",
        priceCents: 65000,
        durationMin: 240,
        sortOrder: 0,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage3.id,
        name: "Embrayage",
        category: "Mécanique lourde",
        description: "Remplacement kit embrayage complet (disque, mécanisme, butée).",
        priceCents: 89000,
        durationMin: 240,
        sortOrder: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: garage3.id,
        name: "Vidange boîte auto",
        category: "Entretien",
        description: "Vidange boîte automatique/DSG. Huile constructeur.",
        priceCents: 29900,
        durationMin: 90,
        sortOrder: 2,
      },
    }),
  ]);

  // ═══════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════
  const [bCount, sCount, bookCount] = await Promise.all([
    prisma.business.count(),
    prisma.service.count(),
    prisma.booking.count(),
  ]);

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${bCount} garages`);
  console.log(`   ${sCount} services`);
  console.log(`   ${bookCount} bookings\n`);

  console.log("🔑 Seed user IDs:");
  console.log("   Garage Dupont:       user_seed_dupont");
  console.log("   AutoService Express: user_seed_express");
  console.log("   Mécanique Dubois:    user_seed_dubois");
  console.log("   Client 1:            user_seed_client1");
  console.log("   Client 2:            user_seed_client2\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
