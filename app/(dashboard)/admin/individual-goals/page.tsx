"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redireciona /admin/individual-goals para /admin/goals?tab=individuais
 * Mantém compatibilidade com links antigos.
 */
export default function IndividualGoalsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/goals?tab=individuais");
  }, [router]);

  return null;
}
