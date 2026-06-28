import { Suspense } from "react";
import { AppShell, Card } from "@/components/ui";
import { PayCancelClient } from "./PayCancelClient";

export const dynamic = "force-dynamic";

export default function PayCancelPage() {
  return <Suspense fallback={<AppShell><Card className="text-center font-black">Pago cancelado</Card></AppShell>}><PayCancelClient /></Suspense>;
}
