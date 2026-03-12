"use client";

import { useState } from "react";
import {
  Bell,
  Globe,
  Monitor,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/providers/ThemeProvider";

const NOTIFICATION_SETTINGS = [
  {
    id: "email_alerts",
    label: "Alertas por e-mail",
    description: "Receber notificações de alertas críticos por e-mail",
    defaultValue: true,
  },
  {
    id: "sync_alerts",
    label: "Alertas de sincronização",
    description: "Notificar quando a sincronização falhar ou atrasar",
    defaultValue: true,
  },
  {
    id: "weekly_digest",
    label: "Resumo semanal",
    description: "Receber um resumo semanal dos principais indicadores",
    defaultValue: false,
  },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("pt-BR");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_SETTINGS.map((s) => [s.id, s.defaultValue]))
  );

  function toggleNotification(id: string) {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize o comportamento da plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Aparência
          </CardTitle>
          <CardDescription>
            Configure o tema visual da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="flex gap-2">
              {themeOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={theme === opt.value ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={() => setTheme(opt.value)}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Idioma e região
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato de moeda</Label>
            <p className="text-sm text-muted-foreground">
              R$ (Real Brasileiro) — baseado no idioma selecionado
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Notificações
          </CardTitle>
          <CardDescription>
            Gerencie como você recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICATION_SETTINGS.map((setting, index) => (
            <div key={setting.id}>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label htmlFor={setting.id} className="text-sm font-medium cursor-pointer">
                    {setting.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.id}
                  checked={notifications[setting.id]}
                  onCheckedChange={() => toggleNotification(setting.id)}
                />
              </div>
              {index < NOTIFICATION_SETTINGS.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-2">
        {saved && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Configurações salvas
          </p>
        )}
        {!saved && <span />}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
