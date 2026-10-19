import type { Generated } from "kysely";

export interface Database {
  customer: CustomerTable;
  job: JobTable;
  service: ServiceTable;
  invoice: InvoiceTable;
  technician: TechnicianTable;
  job_assignment: JobAssignmentTable;
  payment: PaymentTable;
}

export interface CustomerTable {
  customer_id: Generated<number>;
  first_name: string;
  last_name: string;
  email: string;
  phone: number;
  street: string;
  city: string;
  state: string;
  zip_code: number;
}

export interface JobTable {
  job_id: Generated<number>;
  customer_id: number;
  service_id: number;
  title: string;
  description: string;
  status: string;
  requested_at: string;
  scheduled_at: string | null;
  completed_at: string | null;
  service_street: string;
  service_city: string;
  service_state: string;
  service_zip_code: number;
}

export interface ServiceTable {
  service_id: Generated<number>;
  name: string;
  description: string;
  base_price: number;
  is_active: 0 | 1;
}

export interface InvoiceTable {
  invoice_id: Generated<number>;
  job_id: number;
  issued_date: string;
  due_date: string;
  total_amount: number;
  status: string;
}

export interface TechnicianTable {
  technician_id: Generated<number>;
  first_name: string;
  last_name: string;
  email: string;
  phone: number;
  is_active: 0 | 1;
}

export interface JobAssignmentTable {
  job_id: number;
  technician_id: number;
  assigned_at: string;
}

export interface PaymentTable {
  payment_id: Generated<number>;
  invoice_id: number;
  amount: number;
  paid_at: string;
  payment_method: string;
  reference_number: number;
}
