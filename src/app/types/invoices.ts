// types/invoices.ts
export interface Invoice {
    id: string;
    order_number: string;
    full_name: string;
    email: string;
    phone: string;
    country: string;
    province: string;
    city: string;
    address: string;
    payment_method: string;
    amount: number;
    status: string;
    total_price: number;
    created_at: string;
    participant_id: string;
}

// Interfaz para creación de facturas - usamos camelCase para la API
export interface InvoiceCreationData {
    orderNumber: string;
    fullName: string;
    email: string;
    phone: string;
    country: string;
    province: string;
    status: PaymentStatus;
    city: string;
    address: string;
    paymentMethod: string;
    amount: number;
    totalPrice: number;
    participantId?: string;
}

// Estado de pago para facturas
export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}