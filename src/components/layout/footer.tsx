import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold">
              Garage<span className="text-primary">Pro</span>
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Réservez en ligne votre créneau dans les meilleurs garages auto.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Pour les clients</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/garages" className="hover:text-foreground">Trouver un garage</Link></li>
              <li><Link href="/sign-in" className="hover:text-foreground">Mon compte</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Pour les pros</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sign-up" className="hover:text-foreground">Inscrire mon garage</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Espace garagiste</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Politique de confidentialité</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">CGU</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GaragistePro. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
