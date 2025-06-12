// services/referralAuthService.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const validateReferralEmail = async (email: string) => {
    const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('email', email)
        .maybeSingle()

    if (error) throw new Error('Error validando el correo')
    if (!data) throw new Error('Este correo no está registrado como referido')

    return data
}

export const registerReferredUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // No verificación por correo
            emailRedirectTo: undefined
        }
    })

    if (error) throw new Error('Error al registrar el usuario')

    return data.user
}

export const linkUserToReferral = async (email: string, userId: string) => {
    const { error } = await supabase
        .from('referrals')
        .update({ referrer_user_id: userId }) // o como se llame tu campo
        .eq('email', email)

    if (error) throw new Error('Error al vincular usuario al referido')
}

export const isUserReferred = async (userId: string) => {
    const { data, error } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_user_id', userId)
        .maybeSingle()

    if (error) throw new Error('Error validando referido')

    return Boolean(data)
}

export const getReferralCode = async (userId: string) => {
    const { data, error } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_user_id', userId)
        .maybeSingle()

    if (error) throw new Error('Error obteniendo código de referido')

    return data?.referral_code || null
}