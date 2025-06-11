// src/services/authService.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const authService = {
    getUser: async () => {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        return data.user
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },
}
