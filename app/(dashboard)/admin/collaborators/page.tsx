"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Loader2, AlertCircle, UserPlus, Users } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import {
  useAllPeople,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useSquads,
  useCollaborators,
  useInsertCollaborator,
  useUpdateCollaborator,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/shared/ErrorState";
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

const NONE_SQUAD = "__none__";

interface PersonRow {
  id: string;
  name: string;
  role: "sdr" | "closer";
  squad_id: string | null;
  avatar_url: string | null;
  active: boolean;
  squads?: { name: string } | null;
}

export default function CollaboratorsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"equipe" | "acesso">("equipe");

  useEffect(() => {
    if (tabParam === "acesso") setActiveTab("acesso");
    else if (tabParam === "equipe") setActiveTab("equipe");
  }, [tabParam]);

  return (
    <AdminPageWrapper
      title="Colaboradores"
      description="Gerencie a equipe (SDRs e Closers) e o acesso ao sistema"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "equipe" | "acesso")}>
        <TabsList className="mb-4">
          <TabsTrigger value="equipe" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Equipe (SDRs e Closers)
          </TabsTrigger>
          <TabsTrigger value="acesso" className="gap-2">
            <Users className="h-4 w-4" />
            Acesso ao sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipe">
          <EquipeTab />
        </TabsContent>

        <TabsContent value="acesso">
          <AcessoTab />
        </TabsContent>
      </Tabs>
    </AdminPageWrapper>
  );
}

function EquipeTab() {
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
    squad_id: NONE_SQUAD,
    avatar_url: "",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", role: "sdr", squad_id: NONE_SQUAD, avatar_url: "" });
    setToast(null);
    setDialogOpen(true);
  }

  function openEdit(p: PersonRow) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      role: p.role,
      squad_id: p.squad_id ?? NONE_SQUAD,
      avatar_url: p.avatar_url ?? "",
    });
    setToast(null);
    setDialogOpen(true);
  }

  function handleSubmit() {
    const squadId = form.squad_id === NONE_SQUAD ? null : form.squad_id;
    const avatarUrl = form.avatar_url.trim() || null;

    if (editingId) {
      updateMut.mutate(
        {
          id: editingId,
          fields: {
            name: form.name.trim(),
            role: form.role,
            squad_id: squadId,
            avatar_url: avatarUrl,
          },
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setToast({ type: "success", message: "Pessoa atualizada com sucesso." });
          },
          onError: (err) => {
            setToast({
              type: "error",
              message: err instanceof Error ? err.message : "Erro ao atualizar. Tente novamente.",
            });
          },
        },
      );
    } else {
      createMut.mutate(
        {
          name: form.name.trim(),
          role: form.role,
          squad_id: squadId,
          avatar_url: avatarUrl,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setToast({ type: "success", message: "Pessoa cadastrada com sucesso." });
          },
          onError: (err) => {
            setToast({
              type: "error",
              message: err instanceof Error ? err.message : "Erro ao cadastrar. Tente novamente.",
            });
          },
        },
      );
    }
  }

  function toggleActive(p: PersonRow) {
    if (p.active) {
      deleteMut.mutate(p.id, {
        onSuccess: () => setToast({ type: "success", message: "Pessoa desativada." }),
        onError: (err) =>
          setToast({ type: "error", message: err instanceof Error ? err.message : "Erro ao desativar." }),
      });
    } else {
      updateMut.mutate(
        { id: p.id, fields: { active: true } },
        {
          onSuccess: () => setToast({ type: "success", message: "Pessoa reativada." }),
          onError: (err) =>
            setToast({ type: "error", message: err instanceof Error ? err.message : "Erro ao reativar." }),
        },
      );
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              : "border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <p className="text-sm">{toast.message}</p>
          <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setToast(null)}>
            ×
          </Button>
        </div>
      )}

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
                      <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
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
            <DialogTitle>{editingId ? "Editar Pessoa" : "Adicionar Pessoa"}</DialogTitle>
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
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "sdr" | "closer" })}>
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
              <Select value={form.squad_id} onValueChange={(v) => setForm({ ...form, squad_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um squad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_SQUAD}>Nenhum</SelectItem>
                  {(squads as { id: string; name: string }[] | undefined)?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-avatar">URL do avatar (opcional)</Label>
              <Input
                id="person-avatar"
                type="url"
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://..."
              />
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
    </div>
  );
}

function AcessoTab() {
  const { data: collaborators, isLoading, isError, refetch } = useCollaborators();
  const insertMut = useInsertCollaborator();
  const updateMut = useUpdateCollaborator();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");

  function toggleActive(id: string, currentActive: boolean) {
    updateMut.mutate({ id, fields: { active: !currentActive } });
  }

  function handleInvite() {
    if (!newName || !newEmail) return;
    insertMut.mutate(
      { name: newName, email: newEmail, role: newRole },
      {
        onSuccess: () => {
          setNewName("");
          setNewEmail("");
          setNewRole("viewer");
          setDialogOpen(false);
        },
      },
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {collaborators && (
        <>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Convidar
            </Button>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborators.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>
                      <Badge variant={c.role === "admin" ? "default" : "secondary"}>
                        {c.role === "admin" ? "Admin" : "Viewer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={c.active}
                        onCheckedChange={() => toggleActive(c.id, c.active)}
                        disabled={updateMut.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@empresa.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "viewer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={insertMut.isPending || !newName || !newEmail}>
              {insertMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
