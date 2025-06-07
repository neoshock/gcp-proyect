export interface PurchaseToken {
    token: string;
    amount: number;
    price: number;
    expiresAt: Date;
}

export const createPurchaseToken = async (amount: number): Promise<string> => {
    try {
        const response = await fetch('/api/purchase-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
            throw new Error('Error al crear token de compra');
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error creando token:', error);
        throw error;
    }
};
