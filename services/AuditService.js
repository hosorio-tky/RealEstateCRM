import { supabase } from '../lib/supabaseClient';

export const AuditService = {
    async getLogs(tableName, recordId) {
        const { data: logs, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('table_name', tableName)
            .eq('record_id', recordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!logs || logs.length === 0) return [];

        // Collect all related IDs
        const userIds = new Set(logs.map(l => l.changed_by).filter(Boolean));
        const propertyIds = new Set();
        const assignedUserIds = new Set();

        logs.forEach(log => {
            const datas = [log.old_data, log.new_data];
            datas.forEach(d => {
                if (!d) return;
                if (d.property_id) propertyIds.add(d.property_id);
                if (d.assigned_user_id) assignedUserIds.add(d.assigned_user_id);
            });
        });

        // Add assigned users to userIds set to fetch in one go if possible, 
        // but profiles table is what we want.
        assignedUserIds.forEach(id => userIds.add(id));

        // Fetch Profiles
        let profiles = [];
        if (userIds.size > 0) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', [...userIds]);
            profiles = profs || [];
        }

        // Fetch Properties
        let properties = [];
        if (propertyIds.size > 0) {
            const { data: props } = await supabase
                .from('properties')
                .select('id, title')
                .in('id', [...propertyIds]);
            properties = props || [];
        }

        // Create Lookups
        const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p.name || p.email }), {});
        const propertyMap = properties.reduce((acc, p) => ({ ...acc, [p.id]: p.title }), {});

        return logs.map(log => ({
            ...log,
            changed_by_user: profiles.find(p => p.id === log.changed_by) || { email: 'Unknown User' },
            lookups: {
                property_id: propertyMap,
                assigned_user_id: profileMap
            }
        }));
    }
};
