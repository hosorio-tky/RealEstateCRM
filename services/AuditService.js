import { supabase } from '@/lib/supabaseClient';

export const AuditService = {
    getLogs: async (entityType, entityId) => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                user:profiles(name, email)
            `)
            .eq('entity_type', entityType)
            .eq('entity_id', String(entityId))
            .order('created_at', { ascending: false });

        if (error) return { data: [], error };
        return { data, error: null };
    }
};
