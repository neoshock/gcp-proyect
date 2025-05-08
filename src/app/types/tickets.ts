export interface TicketOption {
    amount: number;
    price: number;
}

export interface BlessedNumber {
    id: string;
    value: number;
    claimed: boolean;
    claimedBy?: string; 
    createdAt?: string;
    updatedAt?: string;
}

export interface TicketPurchase {
    id: string;
    email: string;
    amount: number;
    price: number;
    numbers: number[];
    paymentStatus: 'pending' | 'completed' | 'failed';
    purchaseDate: string;
}