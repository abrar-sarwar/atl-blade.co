import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

type ComingSoonProps = {
  title: string;
  phase: string;
  description: string;
};

/** Placeholder shown for admin modules that land in a later phase. */
export function ComingSoon({ title, phase, description }: ComingSoonProps) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Construction className="size-6" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>{description}</p>
        <p className="mt-3 font-medium text-primary">{phase}</p>
      </CardContent>
    </Card>
  );
}
