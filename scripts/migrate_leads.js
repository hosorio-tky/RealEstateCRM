const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE_ROLE_KEY to bypass RLS during migration
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Fetch all leads
    const { data: leads, error: leadsError } = await supabase.from('leads').select('*');
    if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('No leads to migrate.');
        return;
    }

    console.log(`Found ${leads.length} leads to migrate.`);

    for (const lead of leads) {
        console.log(`Processing lead: ${lead.name} (${lead.id})`);

        // 2. Create Contact
        const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .insert({
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                created_at: lead.created_at,
                updated_at: lead.updated_at,
                // created_by? We don't have this in leads, assume null or fetch from user? 
                // If not nullable, we might have issues. Schema allows null for created_by? Let's check schema.
                // It says references auth.users(id), but doesn't say NOT NULL.
            })
            .select()
            .single();

        if (contactError) {
            console.error(`Error creating contact for lead ${lead.id}:`, contactError);
            continue;
        }

        // 3. Create Opportunity
        const { data: opportunity, error: opportunityError } = await supabase
            .from('opportunities')
            .insert({
                contact_id: contact.id,
                property_id: lead.property_id,
                title: lead.name ? `Oportunidad con ${lead.name}` : 'Nueva Oportunidad', // Or use property title?
                stage: lead.stage,
                budget: lead.budget_max, // Map budget_max to budget
                source: lead.source,
                assigned_user_id: lead.assigned_user_id,
                created_at: lead.created_at,
                updated_at: lead.updated_at
            })
            .select()
            .single();

        if (opportunityError) {
            console.error(`Error creating opportunity for lead ${lead.id}:`, opportunityError);
            continue;
        }

        // 4. Update Related Tables (Notes, Activities, Attachments, Audit Logs)
        // We decided in plan to move most to Opportunity.
        // We need to look for records where entity_type = 'lead' and entity_id = lead.id

        // Update Notes
        const { error: notesError } = await supabase
            .from('notes')
            .update({ entity_type: 'opportunity', entity_id: opportunity.id })
            .eq('entity_type', 'lead')
            .eq('entity_id', lead.id);
        if (notesError) console.error('Error updating notes:', notesError);

        // Update Attachments
        const { error: filesError } = await supabase
            .from('attachments')
            .update({ entity_type: 'opportunity', entity_id: opportunity.id })
            .eq('entity_type', 'lead')
            .eq('entity_id', lead.id);
        if (filesError) console.error('Error updating attachments:', filesError);

        // Update Activities
        const { error: activitiesError } = await supabase
            .from('activities')
            .update({ opportunity_id: opportunity.id })
            .eq('lead_id', lead.id);
        if (activitiesError) console.error('Error updating activities:', activitiesError);

        // Update Audit Logs
        // Audit logs have `table_name` = 'leads' and `record_id` = lead.id
        const { error: auditError } = await supabase
            .from('audit_logs')
            .update({ table_name: 'opportunities', record_id: opportunity.id })
            .eq('table_name', 'leads')
            .eq('record_id', lead.id);
        if (auditError) console.error('Error updating audit logs:', auditError);
    }

    console.log('Migration complete.');
}

migrate();
