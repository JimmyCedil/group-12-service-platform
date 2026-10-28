import type { ColumnType, Generated } from "kysely";

type Timestamp = ColumnType<
  Date,
  Date | string,
  Date | string
>;

type DefaultTimestamp = ColumnType<
  Date,
  Date | string | undefined,
  Date | string
>;

type NullableTimestamp = ColumnType<
  Date | null,
  Date | string | null | undefined,
  Date | string | null
>;

// PostgreSQL returns numeric values as strings to preserve precision.
type Money = ColumnType<string, string, string>;

export interface Database {
  session: SessionTable;
  user: UserTable;
  customer: CustomerTable;
  technician: TechnicianTable;
  service: ServiceTable;
  job: JobTable;
  job_assignment: JobAssignmentTable;
  invoice: InvoiceTable;
  payment: PaymentTable;
  job_photo: JobPhotoTable;
}

export interface UserTable {
  user_id: Generated<number>;
  email: string;
  password_hash: string;
  role: "owner" | "technician";
  created_at: DefaultTimestamp;
}

export interface CustomerTable {
  customer_id: Generated<number>;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface TechnicianTable {
  technician_id: Generated<number>;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: Generated<boolean>;
}

export interface ServiceTable {
  service_id: Generated<number>;
  name: string;
  description: string;
  base_price: Money;
  is_active: Generated<boolean>;
}

export interface JobTable {
  job_id: Generated<number>;
  customer_id: number;
  service_id: number;
  title: string;
  description: string;
  status: Generated<
    "requested" | "scheduled" | "in_progress" | "completed"
  >;
  requested_at: DefaultTimestamp;
  scheduled_at: NullableTimestamp;
  completed_at: NullableTimestamp;
  service_street: string;
  service_city: string;
  service_state: string;
  service_zip_code: string;
}

export interface JobAssignmentTable {
  job_id: number;
  technician_id: number;
  assigned_at: DefaultTimestamp;
}

export interface InvoiceTable {
  invoice_id: Generated<number>;
  job_id: number;
  issued_date: Timestamp;
  due_date: Timestamp;
  total_amount: Money;
  status: string;
}

export interface PaymentTable {
  payment_id: Generated<number>;
  invoice_id: number;
  amount: Money;
  paid_at: Timestamp;
  payment_method: string;
  reference_number: string;
}

export interface JobPhotoTable {
  photo_id: Generated<number>;
  job_id: number;
  uploaded_by: number;
  object_key: string;
  original_filename: string;
  content_type: string;
  uploaded_at: DefaultTimestamp;
}

export interface SessionTable {
  token_hash: string;
  user_id: number;
  expires_at: Timestamp;
}
