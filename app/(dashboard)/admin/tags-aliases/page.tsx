"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TagAlias {
  id: string;
  name: string;
  alias: string;
}

const INITIAL_TAGS: TagAlias[] = [
  { id: "1", name: "quente", alias: "Hot Lead" },
  { id: "2", name: "frio", alias: "Cold Lead" },
  { id: "3", name: "indicação", alias: "Referral" },
  { id: "4", name: "orgânico", alias: "Organic" },
  { id: "5", name: "retorno", alias: "Returning" },
];

export default function TagsAliasesPage() {
  const [tags, setTags] = useLocalStorage<TagAlias[]>("dashblue:tags-aliases", INITIAL_TAGS);

  function addTag() {
    setTags((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", alias: "" },
    ]);
  }

  function removeTag(id: string) {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTag(id: string, field: "name" | "alias", value: string) {
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  }

  return (
    <AdminPageWrapper title="Tags e Aliases" description="Configure tags e seus aliases para padronização">
      <div className="space-y-4">
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Input
                      value={tag.name}
                      onChange={(e) => updateTag(tag.id, "name", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={tag.alias}
                      onChange={(e) => updateTag(tag.id, "alias", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => removeTag(tag.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" onClick={addTag}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Adicionar tag
        </Button>
      </div>
    </AdminPageWrapper>
  );
}
