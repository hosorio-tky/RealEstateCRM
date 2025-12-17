const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AGENT_A_EMAIL = 'hosorio@gmail.com';
const AGENT_A_PASS = 'Enjoy1-*';
const AGENT_B_EMAIL = 'hosorio+agentB@gmail.com';
const AGENT_B_PASS = 'password123';

async function runTests() {
    console.log('Starting RLS Verification...');
    console.log('Using credentials:');
    console.log(' Agent A:', AGENT_A_EMAIL);
    console.log(' Agent B:', AGENT_B_EMAIL);

    // --- S-1: Login & Profile Check (Agent A) ---
    console.log(`\n[S-1] Login Agent A...`);
    const supabaseA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authA, error: authErrorA } = await supabaseA.auth.signInWithPassword({
        email: AGENT_A_EMAIL,
        password: AGENT_A_PASS
    });

    if (authErrorA) {
        console.error('FAILED S-1: Login error for A', authErrorA.message);
        process.exit(1);
    }

    const userA = authA.user;
    console.log('Agent A Logged In:', userA.id);

    const { data: profileA, error: profileErrorA } = await supabaseA
        .from('profiles')
        .select('*')
        .eq('id', userA.id)
        .single();

    if (profileErrorA) {
        console.error('FAILED S-1: Could not fetch profile A', profileErrorA.message);
    } else {
        console.log('SUCCESS S-1: Profile found. Role:', profileA.role);
    }

    // --- S-3: RLS Isolation (SELECT) ---
    console.log('\n[S-3] Testing RLS Isolation (Agent A should verify leads)...');
    // Agent A creates a lead for themselves
    await supabaseA.from('leads').insert([{
        name: 'Lead for A',
        email: 'leadA@example.com',
        stage: 'Nuevo',
        assigned_user_id: userA.id,
        property_preference: 'Apartment'
    }]);

    const { data: leadsA, error: leadsErrorA } = await supabaseA.from('leads').select('*');
    if (leadsErrorA) console.error('Error fetching leads A:', leadsErrorA);
    else {
        console.log(`Agent A sees ${leadsA.length} leads.`);
    }


    // --- S-4: RLS Write Security (Agent A vs Agent B) ---
    console.log(`\n[S-4] Testing RLS Write Security (Agent A vs Agent B)...`);

    // 1. Login Agent B
    const supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authB, error: authErrorB } = await supabaseB.auth.signInWithPassword({
        email: AGENT_B_EMAIL,
        password: AGENT_B_PASS
    });

    if (authErrorB) {
        console.error('FAILED: Login error for B', authErrorB.message);
        // Try to create B if login fails? No, we assume it exists from previous steps.
        process.exit(1);
    }
    const userB = authB.user;
    console.log('Agent B Logged In:', userB.id);

    // Agent B creates a lead
    const { data: leadBData, error: createErrorB } = await supabaseB.from('leads').insert([{
        name: 'Lead owned by B',
        email: 'leadB@example.com',
        stage: 'Nuevo',
        assigned_user_id: userB.id
    }]).select().single();

    if (createErrorB) {
        console.error('Agent B could not create lead:', createErrorB.message);
    } else {
        const leadB = leadBData;
        console.log('Lead created by B:', leadB.id);

        // 2. Agent A tries to update Lead B
        console.log('Agent A attempting to update Lead B...');
        const { error: updateError } = await supabaseA
            .from('leads')
            .update({ name: 'HACKED BY A' })
            .eq('id', leadB.id);

        if (updateError) {
            console.log('SUCCESS S-4: Update blocked by RLS (Error returned):', updateError.message);
        } else {
            // Verify value
            const { data: verifyLead } = await supabaseB.from('leads').select('name').eq('id', leadB.id).single();
            if (verifyLead.name === 'HACKED BY A') {
                console.error('FAILED S-4: Agent A successfully updated Agent B lead! SECURITY FLAW.');
            } else {
                console.log('SUCCESS S-4: Update had no effect (Name is still:', verifyLead.name, ')');
            }
        }

        // 3. Verify Isolation (S-3 negative test)
        // Agent A tries to SELECT Lead B
        const { data: leadsA_check } = await supabaseA.from('leads').select('*').eq('id', leadB.id);
        if (leadsA_check && leadsA_check.length > 0) {
            console.error('FAILED S-3: Agent A can SEE Agent B lead! (Row returned)');
        } else {
            console.log('SUCCESS S-3: Agent A cannot see Agent B lead. (Zero rows)');
        }
    }

    // Cleanup? Maybe leave data for manual inspection.
}

runTests().catch(e => console.error(e));
