import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

/**
 * Iniciar sesión con email y contraseña
 */
export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) throw error
    return data
}

/**
 * Cerrar sesión
 */
export const signOutUser = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

/**
 * Obtener la sesión actual del usuario
 */
export const getUserSession = async (): Promise<Session | null> => {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession()

    if (error) {
        console.error('Error al obtener sesión', error)
        return null
    }

    return session
}

/**
 * Obtener datos del usuario actual
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) {
        console.error('Error al obtener usuario', error)
        return null
    }

    return user
}
