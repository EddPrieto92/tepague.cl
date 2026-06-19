import type { BankAccountType, UserPaymentProfile } from "./types";

export const CHILEAN_BANKS = [
  { id: "cl_banco_de_chile", name: "Banco de Chile" },
  { id: "cl_banco_estado", name: "BancoEstado" },
  { id: "cl_banco_santander", name: "Santander" },
  { id: "cl_banco_bci", name: "BCI" },
  { id: "cl_banco_falabella", name: "Banco Falabella" },
] as const;

export const BANK_ACCOUNT_TYPES: Array<{ id: BankAccountType; name: string }> = [
  { id: "checking_account", name: "Cuenta corriente" },
  { id: "sight_account", name: "Cuenta vista" },
];

export function isValidPaymentProfile(profile?: UserPaymentProfile | null): profile is UserPaymentProfile {
  if (!profile?.authorized) return false;
  return Boolean(
    profile.holderName.trim() &&
      profile.holderId.trim() &&
      CHILEAN_BANKS.some((bank) => bank.id === profile.institutionId) &&
      BANK_ACCOUNT_TYPES.some((type) => type.id === profile.accountType) &&
      profile.accountNumber.trim(),
  );
}

export function normalizeChileanHolderId(value: string) {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}
