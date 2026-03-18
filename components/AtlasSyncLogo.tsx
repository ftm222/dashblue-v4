"use client";

import { cn } from "@/lib/utils";

interface AtlasSyncLogoProps {
  className?: string;
  /** Tamanho em pixels (afeta width e height) */
  size?: number;
  /** Incluir texto "Atlas Sync" ao lado */
  withText?: boolean;
  /** Variante para fundos escuros (usa branco no lugar do azul vibrante) */
  variant?: "default" | "light";
}

/**
 * Logo Atlas Sync — geometric "A" com azul navy e azul vibrante.
 * SVG vetorial, escalável sem perda de qualidade.
 */
export function AtlasSyncLogo({ className, size = 32, withText = false, variant = "default" }: AtlasSyncLogoProps) {
  const accentColor = variant === "light" ? "#ffffff" : "#0ea5e9";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="shrink-0 [&]:h-full [&]:w-full"
        aria-hidden
      >
        {/* Forma principal "A" (azul navy escuro, #0f172a) */}
        <path fill="#0f172a" d="M24 4 L6 44 L14 44 L24 24 L34 44 L42 44 Z" />
        {/* Faceta interna esquerda (azul vibrante ciano) */}
        <path fill={accentColor} d="M24 4 L14 44 L20 30 Z" />
      </svg>
      {withText && (
        <span className="font-bold tracking-tight text-slate-900 dark:text-white">
          Atlas Sync
        </span>
      )}
    </div>
  );
}
