export interface Raffle {
    id: string;
    title: string;
    description: string;
    price: number;
    totalNumbers: number;
    drawDate: string;
    isActive: boolean;
}