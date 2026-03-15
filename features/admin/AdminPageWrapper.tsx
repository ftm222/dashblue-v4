"use client";

import type { ReactNode } from "react";
import { SetupChecklist } from "./SetupChecklist";

interface AdminPageWrapperProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminPageWrapper({ children, title, description }: AdminPageWrapperProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <SetupChecklist />

      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground/80">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
}
