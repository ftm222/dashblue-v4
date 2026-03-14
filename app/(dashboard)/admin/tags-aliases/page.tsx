"use client";

import { useRef } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useTags, useInsertTag, useUpdateTag, useDeleteTag } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TagsAliasesPage() {
  const { data: tags, isLoading, isError, refetch } = useTags();
  const insertMut = useInsertTag();
  const updateMut = useUpdateTag();
  const deleteMut = useDeleteTag();
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function addTag() {
    insertMut.mutate({ name: "", alias: "" });
  }

  function removeTag(id: string) {
    deleteMut.mutate(id);
  }

  function handleChange(id: string, field: "name" | "alias", value: string) {
    const key = `${id}-${field}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      updateMut.mutate({ id, fields: { [field]: value } });
    }, 500);
  }

  return (
    <AdminPageWrapper title="Tags e Aliases" description="Configure tags e seus aliases para padronização">
      {isError && <ErrorState onRetry={() => refetch()} />}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {tags && (
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
                        defaultValue={tag.name}
                        onChange={(e) => handleChange(tag.id, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={tag.alias}
                        onChange={(e) => handleChange(tag.id, "alias", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => removeTag(tag.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button variant="outline" size="sm" onClick={addTag} disabled={insertMut.isPending}>
            {insertMut.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-3.5 w-3.5" />
            )}
            Adicionar tag
          </Button>
        </div>
      )}
    </AdminPageWrapper>
  );
}
