import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Conditions générales d'utilisation",
  path: "/terms",
  noIndex: true,
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Conditions Générales d'Utilisation</h1>
      <div className="prose mt-8 max-w-none text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">1. Objet</h2>
        <p>GaragistePro est une plateforme de mise en relation entre clients et garages automobiles pour la réservation de prestations.</p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">2. Réservation</h2>
        <p>La réservation en ligne constitue un engagement ferme. Toute annulation doit être effectuée au minimum 24h avant le rendez-vous.</p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">3. Paiement</h2>
        <p>Le paiement s'effectue selon les modalités définies par chaque garage (sans paiement, acompte ou paiement intégral en ligne).</p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">4. Responsabilité</h2>
        <p>GaragistePro agit en tant qu'intermédiaire technique. La prestation est réalisée sous la responsabilité exclusive du garage.</p>
      </div>
    </div>
  );
}
