import type { Metadata } from "next";

const APP_NAME = "GaragistePro";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://garagistepro.fr";
const DEFAULT_DESCRIPTION =
  "Réservez en ligne votre créneau dans les meilleurs garages auto près de chez vous. Rapide, simple, garanti.";

// ─── Metadata Builder ───────────────────────

interface SeoParams {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  noIndex = false,
}: SeoParams): Metadata {
  const url = `${APP_URL}${path}`;

  return {
    title: `${title} | ${APP_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${APP_NAME}`,
      description,
      url,
      siteName: APP_NAME,
      locale: "fr_FR",
      type: "website",
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${APP_NAME}`,
      description,
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

// ─── JSON-LD LocalBusiness / AutoRepair ─────

interface JsonLdGarageParams {
  name: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  slug: string;
  latitude?: number;
  longitude?: number;
  image?: string;
}

export function buildGarageJsonLd(params: JsonLdGarageParams) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: params.name,
    description: params.description ?? "",
    url: `${APP_URL}/garage/${params.slug}`,
    telephone: params.phone,
    image: params.image,
    address: {
      "@type": "PostalAddress",
      streetAddress: params.address,
      addressLocality: params.city,
      postalCode: params.postalCode,
      addressCountry: "FR",
    },
    ...(params.latitude &&
      params.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: params.latitude,
          longitude: params.longitude,
        },
      }),
  };
}

// ─── Slug Helpers ───────────────────────────

export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function slugToDisplay(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
