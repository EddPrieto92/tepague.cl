import { BillUpload } from "@/components/BillUpload";
import { AppShell, TopBar } from "@/components/ui";

export default function CreatePage() {
  return (
    <AppShell>
      <TopBar title="Crear" />
      <BillUpload />
    </AppShell>
  );
}
