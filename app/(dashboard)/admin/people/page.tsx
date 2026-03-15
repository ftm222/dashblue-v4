"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import {
  useAllPeople,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useSquads,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PersonRow {
  id: string;
  name: string;
  role: "sdr" | "closer";
  squad_id: string | null;
  avatar_url: string | null;
  active: boolean;
  squads: { name: string } | null;
}

export default function PeoplePage() {
  const { data: people, isLoading } = useAllPeople();
  const { data: squads } = useSquads();
  const createMut = useCreatePerson();
  const updateMut = useUpdatePerson();
  const deleteMut = useDeletePerson();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "sdr" as "sdr" | "closer",
    squad_id: "",
  });

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", role: "sdr", squad_id: "" });
    setDialogOpen(true);
  }

  function openEdit(p: PersonRow) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      role: p.role,
      squad_id: p.squad_id ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (editingId) {
      updateMut.mutate(
        {
          id: editingId,
          fields: {
            name: form.name,
            role: form.role,
            squad_id: form.squad_id || null,
          },
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(
        {
          name: form.name,
          role: form.role,
          squad_id: form.squad_id || null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  }

  function toggleActive(p: PersonRow) {
    if (p.active) {
      deleteMut.mutate(p.id);
    } else {
      updateMut.mutate({ id: p.id, fields: { active: true } });
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <AdminPageWrapper
      title="Equipe (SDRs e Closers)"
      description="Gerencie os SDRs e Closers da sua organização"
    >
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead className="w-20 text-center">Ativo</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(people as PersonRow[] | undefined)?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.role === "sdr" ? "default" : "secondary"}>
                        {p.role === "sdr" ? "SDR" : "Closer"}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.squads?.name ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.active}
                        onCheckedChange={() => toggleActive(p)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!people || people.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum SDR ou Closer cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Pessoa" : "Adicionar Pessoa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="person-name">Nome</Label>
              <Input
                id="person-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as "sdr" | "closer" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sdr">SDR</SelectItem>
                  <SelectItem value="closer">Closer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Squad</Label>
              <Select
                value={form.squad_id}
                onValueChange={(v) => setForm({ ...form, squad_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um squad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {squads?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : editingId ? (
                "Salvar"
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
