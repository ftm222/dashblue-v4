"use client";

import { useCallback, useMemo } from "react";
import { Copy, Download, ExternalLink, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EvidenceTable } from "@/components/shared/EvidenceTable";
import { exportEvidenceCSV } from "@/lib/export-csv";
import { useEvidence } from "@/lib/queries";

interface EvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filters: Record<string, string>;
  onOpenAsPage?: () => void;
}

export function EvidenceDrawer({
  open,
  onClose,
  title,
  filters,
  onOpenAsPage,
}: EvidenceDrawerProps) {
  const filterEntries = Object.entries(filters).filter(([, v]) => v);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useEvidence(open ? filters : {}, open);

  const records = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  function handleOpenCRM(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopyContact(text: string) {
    await navigator.clipboard.writeText(text);
  }

  const handleExportCSV = useCallback(() => {
    if (records.length > 0) {
      const timestamp = new Date().toISOString().slice(0, 10);
      exportEvidenceCSV(records, `evidencias-${timestamp}.csv`);
    }
  }, [records]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-2xl lg:max-w-3xl p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Registros de evidência
          </SheetDescription>
          {filterEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filterEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          <EvidenceTable
            records={records}
            loading={isLoading}
            onOpenCRM={handleOpenCRM}
            onCopyContact={handleCopyContact}
          />
          {hasNextPage && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t px-6 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={records.length === 0}
            onClick={() => {
              const first = records[0];
              if (first?.crmUrl) handleOpenCRM(first.crmUrl);
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir CRM
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={records.length === 0}
            onClick={() => {
              const first = records[0];
              if (first) handleCopyContact(first.phone ?? first.email ?? "");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar contato
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={records.length === 0}
            onClick={handleExportCSV}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
          {onOpenAsPage && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={onOpenAsPage}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Abrir como página
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
