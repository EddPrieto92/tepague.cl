"use client";

import { Camera, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card, Input, Label } from "./ui";
import { createBillFromTitle } from "@/lib/storage";

export function BillUpload() {
  const router = useRouter();
  const [title, setTitle] = useState("Mesa viernes");
  const [imageName, setImageName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const bill = createBillFromTitle(title.trim() || "Mesa sin nombre", imageName);
    window.sessionStorage.setItem("mesa-cobrada:active-bill", bill.shareId);
    router.push("/create/review");
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-tomato text-white">
            <ReceiptText size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black leading-none">Sube la cuenta</h1>
            <p className="mt-1 text-sm font-semibold text-ink/65">Despues cada uno reclama lo suyo.</p>
          </div>
        </div>

        <Label>Nombre mesa</Label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Cumple Nico" />

        <div className="mt-4">
          <Label>Foto boleta</Label>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink bg-paper px-4 text-center">
            <Camera size={24} />
            <span className="mt-2 text-sm font-bold">{imageName || "Agregar foto o dejar para despues"}</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => setImageName(event.target.files?.[0]?.name ?? "")}
            />
          </label>
        </div>
      </Card>

      <Button className="w-full" type="submit">
        Crear mesa
      </Button>
    </form>
  );
}
