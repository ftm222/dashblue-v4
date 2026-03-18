"use client";

import { useState } from "react";
import type { CatalogIntegration } from "@/lib/integrations-catalog";

interface IntegrationLogoProps {
  item: CatalogIntegration | null | undefined;
  className?: string;
}

export function IntegrationLogo({ item, className = "" }: IntegrationLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!item) {
    return (
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ${className}`} />
    );
  }

  const useImage = item.logoUrl && !imgError;

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ${useImage ? "bg-white p-1.5" : item.color ?? "bg-muted"} ${className}`}
    >
      {useImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- logos locais SVG em /public/integrations
        <img
          src={item.logoUrl}
          alt={item.name}
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-bold text-sm text-white">{item.logo}</span>
      )}
    </div>
  );
}
