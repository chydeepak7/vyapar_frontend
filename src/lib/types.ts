// ============ Business Profile ============
export interface BusinessProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  state: string;
  logo?: string | null;
  currency: string;
  decimal_places: number;
  financial_year_start?: string | null;
}

// ============ Party ============
export type PartyType = 'Customer' | 'Supplier' | 'Both';

export interface Party {
  id: number;
  name: string;
  type: PartyType;
  phone: string;
  email: string;
  gstin: string;
  billing_address: string;
  shipping_address: string;
  opening_balance: number;
  balance_type: 'To Receive' | 'To Pay';
  group?: string;
  created_at: string;
}

// ============ Item ============
export type ItemUnit = 'PCS' | 'KG' | 'LTR' | 'MTR' | 'BOX' | 'SET' | 'NOS' | 'PAIR' | 'ROLL' | 'BAG';

export interface Item {
  id: number;
  name: string;
  category: string;
  hsn: string;
  unit: ItemUnit;
  sale_price: number;
  purchase_price: number;
  gst_rate: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  description?: string;
  mrp: number;
  created_at: string;
}

// ============ Transaction Line ============
export interface TransactionLine {
  id?: number;
  item?: number | null;
  item_name: string;
  hsn: string;
  qty: number;
  free_qty: number;
  unit: string;
  rate: number;
  discount_percent: number;
  gst_rate: number;
  amount: number;
}

// ============ Transaction ============
export type TxnType =
  | 'SaleInvoice' | 'PurchaseBill' | 'PaymentIn' | 'PaymentOut'
  | 'SaleReturn' | 'PurchaseReturn' | 'Estimate'
  | 'DeliveryChallan' | 'SaleOrder' | 'PurchaseOrder';

export type PaymentType = 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer' | 'Credit';

export interface Transaction {
  id: number;
  type: TxnType;
  invoice_no: string;
  party: number | null;
  party_name: string;
  date: string;
  due_date?: string | null;
  lines: TransactionLine[];
  sub_total: number;
  discount_amount: number;
  additional_charges: number;
  round_off: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_type: PaymentType;
  payment_mode?: string;
  notes?: string;
  terms?: string;
  transport_details?: string;
  state_of_supply?: string;
  reverse_charge: boolean;
  is_gst: boolean;
  created_at: string;
}

// ============ Expense ============
export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  payment_type: PaymentType;
  note: string;
  gst_amount: number;
  is_gst: boolean;
  created_at: string;
}

// ============ Other Income ============
export interface OtherIncome {
  id: number;
  category: string;
  amount: number;
  date: string;
  payment_type: PaymentType;
  note: string;
  created_at: string;
}

// ============ Bank Account ============
export type AccountType = 'Bank' | 'Cash' | 'Wallet' | 'Loan';

export interface BankAccount {
  id: number;
  name: string;
  type: AccountType;
  bank_name?: string;
  account_number?: string;
  ifsc?: string;
  branch?: string;
  opening_balance: number;
  created_at: string;
}

// ============ Settings ============
export interface Settings {
  id: number;
  tax_rates: number[];
  invoice_prefix: string;
  purchase_prefix: string;
  estimate_prefix: string;
  payment_in_prefix: string;
  payment_out_prefix: string;
  credit_note_prefix: string;
  debit_note_prefix: string;
  default_payment_terms: string;
  enable_gst: boolean;
  inclusive_tax: boolean;
  round_off: boolean;
  invoice_theme: string;
  print_company_info: boolean;
  print_terms: boolean;
}

// ============ Dashboard ============
export interface DashboardData {
  currency: string;
  stats: {
    this_month_sales: number;
    this_month_purchases: number;
    cash_in_hand: number;
    stock_value: number;
    total_receivable: number;
    total_payable: number;
    total_expenses: number;
  };
  monthly: { month: string; month_year: string; sales: number; purchases: number }[];
  category_data: { name: string; value: number; color: string }[];
  recent: {
    id: number;
    type: TxnType;
    invoice_no: string;
    party_name: string;
    date: string;
    total_amount: number;
    balance_amount: number;
  }[];
  item_count: number;
  party_count: number;
}

// ============ Party Balance ============
export interface PartyBalance {
  id: number;
  name: string;
  type: PartyType;
  phone: string;
  gstin: string;
  group: string;
  receivable: number;
  payable: number;
}
