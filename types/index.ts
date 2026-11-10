export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  clientId?: string; // e.g. CL-2026-0042 for clients
  companyName?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
  mustChangePassword?: boolean;
}

export interface Client {
  id: string;
  clientId: string; // Unique format: CL-2026-XXXX
  name: string;
  companyName: string;
  logo?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  gstin?: string;
  industry: string;
  source: 'Referral' | 'Instagram' | 'Website' | 'LinkedIn' | 'Direct' | 'Other';
  notes?: string;
  tags: ('VIP' | 'Retainer' | 'One-time' | 'High-Priority')[];
  dateAdded: string;
  lastLogin?: string;
  status: 'Active' | 'Inactive';
  tempPassword?: string;
}

export type ProjectStatus =
  | 'Brief Received'
  | 'In Progress'
  | 'Draft Shared'
  | 'Revisions'
  | 'Approved'
  | 'Final Delivered';

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ProjectType =
  | 'Logo Design'
  | 'Social Media Creatives'
  | 'Reel / Short'
  | 'YouTube Video'
  | 'Ad Film'
  | 'Motion Graphics'
  | 'Branding Kit'
  | 'Thumbnail Design'
  | 'Packaging Design';

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  type: ProjectType;
  description: string;
  referenceLinks?: string[];
  referenceFiles?: string[];
  startDate: string;
  deadline: string;
  deliveryDate?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  revisionsAllowed: number;
  revisionsUsed: number;
  quotedAmount: number;
  currency: string;
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

export type FileStatus = 'Draft' | 'For Review' | 'Changes Requested' | 'Approved' | 'Final';

export interface FileComment {
  id: string;
  fileId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  timestampSeconds?: number; // For video timestamp comment (e.g. 42 for 00:42)
  pinCoordinates?: { x: number; y: number }; // For image pin comment (0 to 100 percentage)
  createdAt: string;
  resolved?: boolean;
}

export interface FileVersion {
  versionNumber: number; // 1, 2, 3
  fileUrl: string;
  thumbnailUrl: string;
  fileType: 'image' | 'video' | 'pdf' | 'psd';
  fileSize: string;
  uploadedAt: string;
  notes?: string;
}

export interface CreativeFile {
  id: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  title: string;
  fileType: 'image' | 'video' | 'pdf' | 'psd';
  fileUrl: string;
  thumbnailUrl: string;
  fileSize: string;
  currentVersion: number;
  versions: FileVersion[];
  status: FileStatus;
  isWatermarked: boolean;
  downloadAllowed: boolean;
  viewCount: number;
  lastViewedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  comments: FileComment[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  service: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

export type TaxType = 'GST (18%)' | 'CGST+SGST (9%+9%)' | 'IGST (18%)' | 'VAT (5%)' | 'None';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0108
  isEstimate?: boolean; // If true, this is a Quotation/Estimate
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress?: string;
  clientGstin?: string;
  projectId?: string;
  projectTitle?: string;
  date: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  taxType: TaxType;
  taxPercent: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch?: string;
    upiId?: string;
  };
  isRecurring?: boolean;
  recurringInterval?: 'Monthly' | 'Quarterly';
  createdAt: string;
}

export type PaymentMode = 'UPI' | 'Bank Transfer' | 'Cash' | 'Card' | 'Cheque' | 'PayPal' | 'Razorpay';

export type PaymentStatus = 'Completed' | 'Pending Confirmation' | 'Rejected';

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  mode: PaymentMode;
  transactionRef: string;
  receiptUrl?: string;
  notes?: string;
  status?: PaymentStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  projectId?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // 'ADMIN' or clientId
  title: string;
  message: string;
  type: 'file_review' | 'approval' | 'invoice' | 'payment' | 'deadline' | 'comment' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  clientId?: string;
  projectId?: string;
  timestamp: string;
}

export interface StudioSettings {
  studioName: string;
  tagline: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  gstin: string;
  currency: string;
  currencySymbol: string;
  logoUrl: string;
  signatureUrl: string;
  upiId: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
    branch: string;
  };
  invoicePrefix: string;
  invoiceNextNumber: number;
  defaultPaymentTerms: string;
  defaultTaxRate: number;
  twoFactorEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  emailNotifications: {
    newFileUploaded: boolean;
    clientFeedback: boolean;
    clientApproval: boolean;
    invoiceSent: boolean;
    paymentReceived: boolean;
    paymentOverdue: boolean;
    deadlineAlert: boolean;
  };
}
