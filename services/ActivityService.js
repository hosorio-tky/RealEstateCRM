
import { supabase } from '@/lib/supabaseClient';

export const ActivityService = {
    async getActivities(opportunityId) {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .order('scheduled_at', { ascending: true });

        if (error) return { data: [], error };
        return { data, error: null };
    },

    async createActivity(activity) {
        // Ensure we map lead_id to opportunity_id if passed (handling generic form)
        const payload = { ...activity };
        if (payload.lead_id && !payload.opportunity_id) {
            payload.opportunity_id = payload.lead_id;
            delete payload.lead_id;
        }

        const { data, error } = await supabase
            .from('activities')
            .insert([payload])
            .select()
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    },

    updateActivity: async (id, updates) => {
        return await supabase.from('activities').update(updates).eq('id', id).select();
    },

    deleteActivity: async (id) => {
        return await supabase.from('activities').delete().eq('id', id);
    },

    completeActivity: async (id, result) => {
        return await supabase
            .from('activities')
            .update({ is_completed: true, result, notes: result }) // Sync notes?
            .eq('id', id)
            .select();
    }
};
