import type { ReactNode } from "react";
import { QaShell } from "@/components/qa/qa-shell";

export default function QaLayout({ children }: { children: ReactNode }) {
  return <QaShell>{children}</QaShell>;
}
