const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const EMAIL = 'hosorio+agentB@gmail.com';
const PASS = 'password123';

async function create() {
    const { data, error } = await supabase.auth.signUp({
        email: EMAIL,
        password: PASS,
        options: { data: { full_name: 'Agent B RLS' } }
    });
    if (error) console.error(error);
    else console.log('User Created (ID):', data.user.id);
}
create();
