import { supabase } from '@/lib/supabaseClient';

export const OpportunityService = {
    // Get all opportunities (can filter by pipeline stage later)
    getOpportunities: async () => {
        const { data: opportunities, error } = await supabase
            .from('opportunities')
            .select(`
                *,
                contact:contacts(*),
                property:properties(id, title),
                assigned_user:profiles(id, name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) return { data: [], error };

        // Transform if necessary to match UI expectations (flatten structure?)
        return { data: opportunities, error: null };
    },

    // Get single opportunity
    getOpportunity: async (id) => {
        const { data, error } = await supabase
            .from('opportunities')
            .select(`
                *,
                contact:contacts(*),
                property:properties(id, title),
                assigned_user:profiles(id, name, email)
            `)
            .eq('id', id)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    },

    // Create opportunity
    createOpportunity: async (opportunity) => {
        const { data, error } = await supabase
            .from('opportunities')
            .insert([opportunity])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update opportunity
    updateOpportunity: async (id, updates) => {
        const { data, error } = await supabase
            .from('opportunities')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete opportunity
    deleteOpportunity: async (id) => {
        const { error } = await supabase
            .from('opportunities')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
