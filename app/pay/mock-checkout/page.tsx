import { Suspense } from "react";
import { AppShell, Card } from "@/components/ui";
import { MockCheckoutClient } from "./MockCheckoutClient";

export const dynamic = "force-dynamic";

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Card>
            <p className="text-sm font-black">Cargando checkout...</p>
          </Card>
        </AppShell>
      }
    >
      <MockCheckoutClient />
    </Suspense>
  );
}
