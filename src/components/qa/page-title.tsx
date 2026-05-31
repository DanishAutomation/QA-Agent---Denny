import { Badge } from "@/components/ui/badge";

interface PageTitleProps {
  title: string;
  subtitle: string;
  tag?: string;
}

export function PageTitle({ title, subtitle, tag }: PageTitleProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {tag ? <Badge variant="outline">{tag}</Badge> : null}
    </div>
  );
}
