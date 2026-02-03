import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Politique de confidentialité",
  path: "/privacy",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <div className="prose mt-8 max-w-none text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">1. Données collectées</h2>
        <p>
          Nous collectons les données nécessaires à la gestion des réservations :
          nom, email, téléphone, plaque d'immatriculation et informations véhicule.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">2. Utilisation</h2>
        <p>
          Vos données sont utilisées exclusivement pour la gestion de vos réservations,
          l'envoi de confirmations et rappels, et la communication avec le garage choisi.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">3. Partage</h2>
        <p>
          Vos données sont partagées uniquement avec le garage auprès duquel vous effectuez
          une réservation. Nous ne vendons pas vos données à des tiers.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">4. Conservation</h2>
        <p>
          Les données de réservation sont conservées pendant 3 ans après la dernière
          interaction. Vous pouvez demander leur suppression à tout moment.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">5. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
          de suppression et de portabilité de vos données. Contactez-nous à
          privacy@garagistepro.fr.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">6. Cookies</h2>
        <p>
          Nous utilisons des cookies essentiels au fonctionnement du site (authentification,
          session). Aucun cookie publicitaire n'est utilisé.
        </p>
      </div>
    </div>
  );
}
