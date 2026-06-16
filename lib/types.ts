export type BillStatus = "draft" | "open" | "locked" | "closed";
export type ParticipantStatus = "selecting" | "confirmed" | "paid";
export type PaymentMethod = "link" | "qr" | "transfer" | "mixed";
export type PaymentStatus = "created" | "redirected" | "succeeded" | "failed" | "expired" | "requires_action";

export type UserPaymentProfile = {
  id: string;
  userId: string;
  holderName: string;
  holderId: string;
  institutionId: string;
  accountType: string;
  accountNumber: string;
  authorized: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  billId: string;
  participantId: string;
  amount: number;
  serviceFeeAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  fintocCheckoutSessionId?: string;
  fintocPaymentIntentId?: string;
  fintocRedirectUrl?: string;
  rawWebhookEvent?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type BillItem = {
  id: string;
  billId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isShared: boolean;
};

export type ParticipantItem = {
  id: string;
  participantId: string;
  billItemId: string;
  quantity: number;
  amount: number;
};

export type ParticipantAdjustment = {
  id: string;
  participantId: string;
  label: string;
  amount: number;
};

export type Participant = {
  id: string;
  billId: string;
  name: string;
  totalAmount: number;
  includeTip?: boolean;
  status: ParticipantStatus;
  paidAt?: string;
  items: ParticipantItem[];
  adjustments: ParticipantAdjustment[];
};

export type Bill = {
  id: string;
  shareId: string;
  title: string;
  imageUrl?: string;
  subtotal: number;
  tip: number;
  serviceFee: number;
  discount: number;
  total: number;
  includeTipInTotal?: boolean;
  status: BillStatus;
  paymentMethod: PaymentMethod;
  paymentLink?: string;
  paymentQrUrl?: string;
  receiverName?: string;
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  receiverIdentifier?: string;
  paymentNote?: string;
  serviceFeeTotal?: number;
  serviceFeePerParticipant?: number;
  paymentProfile?: UserPaymentProfile;
  payments?: Payment[];
  items: BillItem[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardParticipant = {
  id: string;
  name: string;
  totalAmount: number;
  status: ParticipantStatus;
  paidAt?: string;
};

export type Dashboard = {
  expectedTotal: number;
  confirmedTotal: number;
  paidTotal: number;
  pendingTotal: number;
  participants: DashboardParticipant[];
};

export type FunSummary = {
  kingOfSpend?: DashboardParticipant;
  mostChill?: DashboardParticipant;
  firstPaid?: DashboardParticipant;
  lastPending?: DashboardParticipant;
  mostSharedItem?: BillItem;
  starProduct?: BillItem;
};
