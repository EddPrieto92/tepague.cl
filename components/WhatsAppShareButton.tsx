"use client";

import { MessageCircle } from "lucide-react";
import type { Bill } from "@/lib/types";
import { generateWhatsAppShareText } from "@/lib/calculations";
import { Button } from "./ui";

export function WhatsAppShareButton({ bill }: { bill: Bill }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const text = generateWhatsAppShareText(bill, origin);

  return (
    <a className="block" href={`https://wa.me/?text=${text}`} rel="noreferrer" target="_blank">
      <Button className="w-full" type="button">
        <MessageCircle size={18} /> Compartir WhatsApp
      </Button>
    </a>
  );
}
