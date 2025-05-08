import { supabase } from "../lib/supabase";

export async function getActiveRaffle() {
    const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .eq("is_active", true)
        .single();

    if (error) throw error;
    return data;
}
