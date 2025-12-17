import { supabase } from '../lib/supabaseClient';

export const NoteService = {
    async getNotes(entityType, entityId) {
        // First get notes
        const { data: notes, error } = await supabase
            .from('notes')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!notes || notes.length === 0) return [];

        // Enrich with profile names
        const userIds = [...new Set(notes.map(n => n.created_by).filter(Boolean))];

        let profiles = [];
        if (userIds.length > 0) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds);
            profiles = profs || [];
        }

        return notes.map(note => ({
            ...note,
            author: profiles.find(p => p.id === note.created_by) || { email: 'Unknown User' }
        }));
    },

    async createNote(content, entityType, entityId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('notes')
            .insert([
                {
                    content,
                    entity_type: entityType,
                    entity_id: entityId,
                    created_by: user.id
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateNote(id, content) {
        const { error } = await supabase
            .from('notes')
            .update({ content })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteNote(id) {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
