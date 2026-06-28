export type BillStatus = "draft" | "open" | "locked" | "closed";
export type ParticipantStatus = "selecting" | "confirmed" | "payment_pending" | "paid" | "failed" | "expired";
export type PaymentMethod = "link" | "qr" | "transfer" | "mixed";
export type PaymentStatus = "created" | "redirected" | "pending" | "succeeded" | "failed" | "expired" | "requires_action";
export type OcrStatus = "success" | "partial" | "empty" | "failed";
export type SplitMode = "unit" | "shared_by_claimants" | "split_all" | "invited_by" | "excluded";
export type ClaimStatus = "complete" | "partial" | "unclaimed" | "overclaimed" | "excluded";
export type BankAccountType = "checking_account" | "sight_account";

export type UserPaymentProfile = {
  id: string;
  userId: string;
  holderName: string;
  holderId: string;
  institutionId: string;
  accountType: BankAccountType | "";
  accountNumber: string;
  authorized: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  billId: string;
  participantId: string;
  billShareId: string;
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
  sharedCount?: number;
  sharedPrice?: number;
  splitMode: SplitMode;
  paidByParticipantId?: string;
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
  organizerName?: string;
  imageUrl?: string;
  ocrStatus?: OcrStatus;
  ocrRawText?: string;
  expectedParticipantCount: number;
  receiptSubtotal?: number;
  receiptTip?: number;
  receiptTotal?: number;
  enteredSubtotal: number;
  enteredTip: number;
  enteredTotal: number;
  missingAmount: number;
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
  claimedTotal: number;
  missingClaimAmount: number;
  confirmedTotal: number;
  paidTotal: number;
  pendingTotal: number;
  participants: DashboardParticipant[];
  missingItems: ItemClaimSummary[];
};

export type ItemClaimSummary = {
  itemId: string;
  name: string;
  claimedQuantity: number;
  remainingQuantity: number;
  claimedAmount: number;
  remainingAmount: number;
  claimStatus: ClaimStatus;
};

export type FunSummary = {
  kingOfSpend?: DashboardParticipant;
  mostChill?: DashboardParticipant;
  firstPaid?: DashboardParticipant;
  lastPending?: DashboardParticipant;
  mostSharedItem?: BillItem;
  starProduct?: BillItem;
};
