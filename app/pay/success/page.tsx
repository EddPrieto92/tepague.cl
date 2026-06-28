import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppShell, Card } from "@/components/ui";
import { PaySuccessClient } from "./PaySuccessClient";

export const dynamic = "force-dynamic";

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Card className="space-y-4 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-lg bg-aqua text-white">
              <Loader2 className="animate-spin" size={30} />
            </div>
            <h1 className="text-3xl font-black leading-none">Estamos confirmando tu pago...</h1>
          </Card>
        </AppShell>
      }
    >
      <PaySuccessClient />
    </Suspense>
  );
}
