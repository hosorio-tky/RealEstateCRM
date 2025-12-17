const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || envConfig.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is required in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const ADMIN_EMAIL = 'hosorio@gmail.com';
const ADMIN_PASS = 'Enjoy1-*';

async function generateEmbeddings() {
    // Authenticate as Admin to bypass RLS for Updates
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS
    });
    if (authError) {
        console.error('Authentication check failed:', authError.message);
        // proceed? might fail updates.
        return;
    }
    console.log('Authenticated as Admin.');

    console.log('Fetching properties without embeddings...');

    // Fetch properties where embedding is null
    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, description, address_line_1, city, price')
        .is('embedding', null);

    if (error) {
        console.error('Error fetching properties:', error);
        return;
    }

    console.log(`Found ${properties.length} properties to process.`);

    for (const property of properties) {
        console.log(`Processing: ${property.title}`);

        const textToEmbed = `
Title: ${property.title}
Price: ${property.price}
Location: ${property.address_line_1}, ${property.city}
Description: ${property.description || ''}
        `.trim();

        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: textToEmbed,
            });

            const embedding = response.data[0].embedding;

            const { error: updateError } = await supabase
                .from('properties')
                .update({ embedding })
                .eq('id', property.id);

            if (updateError) {
                console.error(`Failed to update property ${property.id}:`, updateError);
            } else {
                console.log(`Updated property ${property.id}`);
            }
        } catch (err) {
            console.error(`Failed to generate embedding for ${property.id}:`, err.message);
        }

        // Rate limiting precaution
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('Done!');
}

generateEmbeddings().catch(console.error);
