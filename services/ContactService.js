import { supabase } from '@/lib/supabaseClient';

export const ContactService = {
    // Get all contacts
    getContacts: async () => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return { data: [], error };
        return { data, error: null };
    },

    // Get single contact by ID
    getContact: async (id) => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    },

    // Create new contact
    createContact: async (contact) => {
        const { data, error } = await supabase
            .from('contacts')
            .insert([contact])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update contact
    updateContact: async (id, updates) => {
        const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete contact (and cascade opportunities?)
    deleteContact: async (id) => {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
