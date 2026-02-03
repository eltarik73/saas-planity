import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Page introuvable</p>
      <p className="mt-2 text-sm text-muted-foreground">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>Retour à l'accueil</Button>
        </Link>
        <Link href="/garages">
          <Button variant="outline">Trouver un garage</Button>
        </Link>
      </div>
    </div>
  );
}
