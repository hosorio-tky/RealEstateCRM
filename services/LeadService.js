import { supabase } from '@/lib/supabaseClient';

export const LeadService = {
    getLeads: async () => {
        // Fetch leads first
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*');

        if (leadsError) return { data: null, error: leadsError };

        if (!leads || leads.length === 0) return { data: [], error: null };

        // Fetch profiles for the leads
        const userIds = [...new Set(leads.map(l => l.assigned_user_id).filter(Boolean))];

        // If no assigned users, just return leads
        if (userIds.length === 0) return { data: leads, error: null };

        const propertyIds = [...new Set(leads.map(l => l.property_id).filter(Boolean))];

        let properties = [];
        if (propertyIds.length > 0) {
            const { data: props, error: propsError } = await supabase
                .from('properties')
                .select('id, title')
                .in('id', propertyIds);

            if (propsError) console.error('Error fetching properties', propsError);
            else properties = props || [];
        }

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, role')
            .in('id', userIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Return leads anyway
        }

        // Merge data
        const leadsWithProfiles = leads.map(lead => {
            const profile = profiles ? profiles.find(p => p.id === lead.assigned_user_id) : null;
            const property = properties.find(p => p.id === lead.property_id);
            return {
                ...lead,
                assigned_user: profile, // Map to 'assigned_user' property expected by UI
                property: property
            };
        });

        return { data: leadsWithProfiles, error: null };
    },

    updateLead: async (id, updates) => {
        return await supabase.from('leads').update(updates).eq('id', id).select();
    },

    deleteLead: async (id) => {
        return await supabase.from('leads').delete().eq('id', id);
    },

    createLead: async (lead) => {
        const { data: { user } } = await supabase.auth.getUser();
        // Assign to current user by default if not specified
        const leadWithUser = { ...lead, assigned_user_id: user.id };
        return await supabase.from('leads').insert([leadWithUser]).select();
    },

    getLead: async (id) => {
        const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).single();
        if (error) return { data: null, error };

        // Fetch relations
        let property = null;
        if (lead.property_id) {
            const { data: prop } = await supabase.from('properties').select('id, title').eq('id', lead.property_id).single();
            property = prop;
        }

        let profile = null;
        if (lead.assigned_user_id) {
            const { data: prof } = await supabase.from('profiles').select('id, name, email').eq('id', lead.assigned_user_id).single();
            profile = prof;
        }

        return { data: { ...lead, property, assigned_user: profile }, error: null };
    },
};
