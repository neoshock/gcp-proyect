import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export interface Referido {
    id: string
    referral_code: string
    name: string
    email?: string
    phone?: string
    commission_rate: number
    is_active: boolean
    created_at: string
    total_participants?: number
    total_sales?: number
    total_commission?: number
}

export interface ReferidoInput {
    name: string
    email?: string
    phone?: string
    referral_code: string
    commission_rate: number
    is_active: boolean
}

export async function getCurrentUserId() {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Usuario no autenticado')
    return data.user.id
}

export async function createReferido(input: ReferidoInput) {

    if (input.email) {
        // Validar si el correo ya existe en referrals
        const { data: existing, error: fetchError } = await supabase
            .from('referrals')
            .select('id')
            .eq('email', input.email)
            .limit(1)
            .maybeSingle();

        console.log('Existing referral check:', existing, fetchError);

        if (fetchError) {
            console.error('Error al validar email existente:', fetchError);
            throw fetchError;
        }

        if (existing) {
            throw new Error('email_already_exists');
        }
    }

    const { error } = await supabase.from('referrals').insert([
        {
            ...input,
            referral_code: input.referral_code.toUpperCase(),
            updated_at: new Date().toISOString(),
        },
    ]);

    if (error) {
        if (error.code === '23505') {
            throw new Error('duplicate_referral_code');
        }
        throw error;
    }

    // ✅ Llamar a la API de verificación
    if (input.email) {
        const referralLink = `${NEXT_PUBLIC_BASE_URL}/?ref=${encodeURIComponent(input.referral_code)}`;
        const verifyUrl = `${NEXT_PUBLIC_BASE_URL}/verifyuser?email=${encodeURIComponent(input.email)}`;

        try {
            await fetch('/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: input.name,
                    email: input.email,
                    referralLink,
                    verifyUrl,
                }),
            });
        } catch (apiError) {
            console.error('Error al enviar correo de verificación:', apiError);
            // ❗No interrumpimos la creación del referido por un fallo de correo
        }
    }
}

export async function updateReferido(id: string, input: ReferidoInput) {
    const { error } = await supabase
        .from('referrals')
        .update({
            ...input,
            referral_code: input.referral_code.toUpperCase(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) throw error
}

export const getReferidos = async (): Promise<Referido[]> => {
    // Consulta para obtener referidos junto con totales de facturas
    const { data, error } = await supabase
        .from('referrals')
        .select(`
      *,
      invoices (
        id,
        total_price
      )
    `)
        .order('created_at', { ascending: false })
        .filter('invoices.status', 'eq', 'completed') 

    if (error) {
        console.error('Error al obtener referidos:', error)
        throw error
    }

    return (
        data?.map((referido: any) => {
            const totalSales = referido.invoices?.reduce((sum: number, inv: any) => {
                return sum + (inv.total_price || 0)
            }, 0) || 0

            const totalParticipants = referido.invoices
                ? new Set(referido.invoices.map((inv: any) => inv.participant_id)).size
                : 0

            const totalCommission = totalSales * referido.commission_rate

            return {
                ...referido,
                total_participants: totalParticipants,
                total_sales: totalSales,
                total_commission: totalCommission
            }
        }) || []
    )
}

export const deleteReferido = async (id: string) => {
    const { error } = await supabase.from('referrals').delete().eq('id', id)
    if (error) throw error
}

export const toggleReferidoStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
        .from('referrals')
        .update({ is_active: !currentStatus })
        .eq('id', id)
    if (error) throw error
}
