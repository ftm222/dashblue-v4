"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Collaborator } from "@/types";

const INITIAL_COLLABORATORS: Collaborator[] = [
  { id: "1", name: "Lucas Silva", email: "lucas@dashblue.com", role: "admin", active: true },
  { id: "2", name: "Mariana Santos", email: "mariana@dashblue.com", role: "admin", active: true },
  { id: "3", name: "Pedro Oliveira", email: "pedro@dashblue.com", role: "viewer", active: true },
  { id: "4", name: "Ana Souza", email: "ana@dashblue.com", role: "viewer", active: false },
];

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useLocalStorage<Collaborator[]>("dashblue:collaborators", INITIAL_COLLABORATORS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");

  function toggleActive(id: string) {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
    );
  }

  function handleInvite() {
    if (!newName || !newEmail) return;
    setCollaborators((prev) => [
      ...prev,
      { id: String(Date.now()), name: newName, email: newEmail, role: newRole, active: true },
    ]);
    setNewName("");
    setNewEmail("");
    setNewRole("viewer");
    setDialogOpen(false);
  }

  return (
    <AdminPageWrapper title="Colaboradores" description="Gerencie os membros da equipe">
      <div className="space-y-4">
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
                      onCheckedChange={() => toggleActive(c.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

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
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@empresa.com" type="email" />
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
            <Button onClick={handleInvite}>Convidar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
