"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie.includes("cookie_consent=true");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    document.cookie = "cookie_consent=true; max-age=31536000; path=/; SameSite=Lax";
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Ce site utilise des cookies essentiels au fonctionnement.{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            En savoir plus
          </Link>
        </p>
        <Button onClick={accept} size="sm">
          Accepter
        </Button>
      </div>
    </div>
  );
}
