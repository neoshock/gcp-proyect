export interface Raffle {
    id: string;
    title: string;
    description: string;
    price: number;
    total_numbers: number;
    drawDate: string;
    isActive: boolean;
}