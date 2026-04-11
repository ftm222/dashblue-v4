"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { usePeople, useCreateSquad, useSquads } from "@/lib/queries";
import { useAuth } from "@/providers/AuthProvider";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { groupBySquad, mergeSquadsFromRegistry } from "@/lib/squad-utils";
import { SquadPodium } from "@/features/squads/SquadPodium";
import { SquadGoalProgress } from "@/features/squads/SquadGoalProgress";
import { SquadMetricsComparison } from "@/features/squads/SquadMetricsComparison";
import { SquadMemberPerformance } from "@/features/squads/SquadMemberPerformance";
import { SquadProjections } from "@/features/squads/SquadProjections";
import { SquadComparativeAnalysis } from "@/features/squads/SquadComparativeAnalysis";

const ROLES_CAN_CREATE_SQUAD = new Set(["owner", "admin", "manager"]);

export default function SquadsPage() {
  const { period } = usePeriodFilter();
  const { profile, loading: authLoading } = useAuth();
  const sdrs = usePeople("sdr", period);
  const closers = usePeople("closer", period);
  const {
    data: squadRegistry,
    isLoading: squadsListLoading,
    isError: squadsListError,
    refetch: refetchSquads,
  } = useSquads();
  const createSquad = useCreateSquad();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = sdrs.isLoading || closers.isLoading || squadsListLoading;
  const hasError = sdrs.isError || closers.isError || squadsListError;

  const squads = useMemo(() => {
    const fromPeople = groupBySquad(sdrs.data ?? [], closers.data ?? []);
    return mergeSquadsFromRegistry(fromPeople, squadRegistry ?? []);
  }, [sdrs.data, closers.data, squadRegistry]);

  const canCreateSquad =
    !authLoading && profile?.role != null && ROLES_CAN_CREATE_SQUAD.has(profile.role);

  function handleOpenDialog() {
    setSquadName("");
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = squadName.trim();
    if (!name) {
      setFormError("Informe o nome do squad.");
      return;
    }
    createSquad.mutate(name, {
      onSuccess: () => {
        setDialogOpen(false);
        setSquadName("");
      },
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : "Não foi possível criar o squad.");
      },
    });
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ErrorState
          onRetry={() => {
            sdrs.refetch();
            closers.refetch();
            refetchSquads();
          }}
        />
      </div>
    );
  }

  const squadNames = squads.map((s) => s.name).join(" vs ");

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Guerra de Squads</h1>
          {!isLoading && squads.length > 0 && (
            <p className="text-sm text-muted-foreground/80">{squadNames}</p>
          )}
        </div>
        {canCreateSquad && (
          <Button type="button" size="sm" className="shrink-0 gap-1.5 self-start" onClick={handleOpenDialog}>
            <Plus className="h-4 w-4" />
            Novo squad
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Cadastrar squad</DialogTitle>
              <DialogDescription>
                O nome deve ser único na sua organização. Depois, vincule SDRs e closers em{" "}
                <span className="font-medium text-foreground">Admin → Colaboradores</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="squad-name">Nome do squad</Label>
              <Input
                id="squad-name"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder="Ex.: Alpha, Time Norte…"
                autoComplete="off"
                disabled={createSquad.isPending}
                maxLength={120}
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={createSquad.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createSquad.isPending}>
                {createSquad.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-8 w-52" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <>
          <SquadPodium squads={squads} />
          <SquadGoalProgress squads={squads} />
          <SquadMetricsComparison squads={squads} />
          <SquadMemberPerformance squads={squads} />
          <SquadProjections squads={squads} />
          <SquadComparativeAnalysis squads={squads} />
        </>
      )}
    </div>
  );
}
