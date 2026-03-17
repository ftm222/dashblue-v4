"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redireciona /admin/people para /admin/collaborators?tab=equipe
 * Mantém compatibilidade com links antigos.
 */
export default function PeopleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/collaborators?tab=equipe");
  }, [router]);

  return null;
}
