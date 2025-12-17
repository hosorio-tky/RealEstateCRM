import { supabase } from '../lib/supabaseClient';

export const FileService = {
    async getFiles(entityType, entityId) {
        const { data, error } = await supabase
            .from('attachments')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async uploadFile(file, entityType, entityId) {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error("User not authenticated");

        // 1. Upload to Storage
        // Path format: {userId}/{entityType}/{entityId}/{timestamp}_{filename}
        const timestamp = new Date().getTime();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${user.id}/${entityType}/${entityId}/${timestamp}_${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
            .from('crm-files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Create DB Record
        const { data, error: dbError } = await supabase
            .from('attachments')
            .insert([
                {
                    file_name: file.name,
                    file_path: filePath,
                    file_type: file.type,
                    file_size: file.size,
                    entity_type: entityType,
                    entity_id: entityId
                }
            ])
            .select()
            .single();

        if (dbError) {
            // Cleanup storage if DB fails? For now, risk orphan file.
            throw dbError;
        }
        return data;
    },

    async deleteFile(id, filePath) {
        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('crm-files')
            .remove([filePath]);

        if (storageError) throw storageError;

        // 2. Delete from DB
        const { error: dbError } = await supabase
            .from('attachments')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return true;
    },

    getDownloadUrl(filePath) {
        const { data } = supabase.storage.from('crm-files').getPublicUrl(filePath);
        return data.publicUrl;
    }
};
