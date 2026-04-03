"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LocationCardProps {
  name: string;
  description: string;
  highlights: string[];
  permitRequired: boolean;
  bestTime: string;
  imagePlaceholder?: string;
}

export function LocationCard({
  name,
  description,
  highlights,
  permitRequired,
  bestTime,
}: LocationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          {permitRequired && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Permit needed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-1">
          {highlights.map((h) => (
            <Badge key={h} variant="secondary" className="text-xs">
              {h}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Best light: {bestTime}</p>
      </CardContent>
    </Card>
  );
}
