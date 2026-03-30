import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlatformSectionPlaceholder(props: {
  eyebrow: string;
  title: string;
  description: string;
  nextTicket: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.eyebrow}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{props.description}</p>
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          Next ticket: {props.nextTicket}
        </div>
      </CardContent>
    </Card>
  );
}
