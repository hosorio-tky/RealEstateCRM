import { supabase } from '@/lib/supabaseClient';

export const PropertyService = {
    getProperties: async ({ page = 1, pageSize = 10, filters = {} }) => {
        let query = supabase
            .from('properties')
            .select('*', { count: 'exact' })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error, count } = await query;
        return { data, error, count };
    },

    getProperty: async (id) => {
        return await supabase.from('properties').select('*').eq('id', id).single();
    },

    createProperty: async (propertyData) => {
        return await supabase.from('properties').insert([propertyData]).select();
    },

    updateProperty: async (id, propertyData) => {
        return await supabase.from('properties').update(propertyData).eq('id', id).select();
    },

    deleteProperty: async (id) => {
        return await supabase.from('properties').delete().eq('id', id);
    },

    uploadImage: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('property_images')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('property_images').getPublicUrl(filePath);
        return data.publicUrl;
    },
};
