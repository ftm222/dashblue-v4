"use client";

import { useState } from "react";
import { Camera, Mail, Phone, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "Usuário Dashblue",
    email: "usuario@dashblue.com",
    phone: "+55 11 99999-0000",
    role: "admin" as "admin" | "viewer",
  });

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {form.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors">
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{form.name}</p>
            <p className="text-xs text-muted-foreground">{form.email}</p>
            <Badge variant="secondary" className="mt-1 gap-1">
              <Shield className="h-3 w-3" />
              {form.role === "admin" ? "Administrador" : "Visualizador"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Nome completo
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Telefone
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            {saved && (
              <p className="text-sm text-emerald-600 font-medium">
                Salvo com sucesso
              </p>
            )}
            {!saved && <span />}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Alterar senha</p>
              <p className="text-xs text-muted-foreground">
                Atualize sua senha de acesso
              </p>
            </div>
            <Button variant="outline" size="sm">
              Alterar
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sessões ativas</p>
              <p className="text-xs text-muted-foreground">
                1 sessão ativa neste dispositivo
              </p>
            </div>
            <Button variant="outline" size="sm">
              Gerenciar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
