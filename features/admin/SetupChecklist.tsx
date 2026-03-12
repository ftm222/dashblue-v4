"use client";

import Link from "next/link";
import { useSetupChecklist } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function SetupChecklist() {
  const { data, isLoading } = useSetupChecklist();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (!data || data.length === 0) return null;

  const completed = data.filter((item) => item.completed).length;
  const percentage = Math.round((completed / data.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Setup</CardTitle>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {completed}/{data.length} ({percentage}%)
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((item) => (
          <div key={item.key} className="flex items-center gap-2.5">
            <Checkbox checked={item.completed} disabled className="pointer-events-none" />
            <Link
              href={item.route}
              className="text-sm hover:underline text-foreground/90"
            >
              {item.label}
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
