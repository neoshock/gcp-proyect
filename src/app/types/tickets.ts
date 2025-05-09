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

export interface TicketNumber {
    number: string;
    isWinner: boolean;
}

export interface TicketPurchase {
    id: string;
    email: string;
    numbers: TicketNumber[];
    paymentStatus: 'pending' | 'completed' | 'failed';
    purchaseDate: string;
}
