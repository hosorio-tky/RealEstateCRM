import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4.28.0"

console.log("Hello from WhatsApp Webhook!")

serve(async (req) => {
    try {
        // 1. Initial Setup
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

        if (!OPENAI_API_KEY) {
            throw new Error("Missing OPENAI_API_KEY");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

        // 2. Parse Twilio Request
        // Twilio sends data as 'application/x-www-form-urlencoded'
        const formData = await req.formData();
        const incomingMsg = formData.get('Body')?.toString() || '';
        const sender = formData.get('From')?.toString() || '';

        console.log(`Received message from ${sender}: ${incomingMsg}`);

        if (!incomingMsg) {
            return new Response("No message body", { status: 400 });
        }

        // 3. Generate Embedding for User Query
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: incomingMsg,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 4. Search Matching Properties (RAG)
        const { data: properties, error: matchError } = await supabase.rpc('match_properties', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Adjust sensitivity
            match_count: 3       // Top 3 results
        });

        if (matchError) {
            console.error('RPC Error:', matchError);
            throw matchError;
        }

        // 5. Build Context for LLM
        let contextText = "";
        if (properties && properties.length > 0) {
            contextText = properties.map((p: any) =>
                `- ${p.title} (Price: ${p.price}, ID: ${p.id}): ${p.description}. Image: ${p.image_url}`
            ).join("\n");
        } else {
            contextText = "No direct property matches found in database.";
        }

        const systemPrompt = `
You are a helpful and professional Real Estate Agent assistant for a CRM.
Your goal is to answer user queries based STRICTLY on the provided context of available properties.
If the user asks for properties, recommend the ones from the context that fit their needs.
If the context is empty or doesn't match, politely say you don't have matching properties right now but ask for more details.
Do not invent properties.
Always be concise, friendly, and encourage a visit or call.
    `.trim();

        // 6. Generate Answer with GPT-4
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "system", content: `Context Properties:\n${contextText}` },
                { role: "user", content: incomingMsg }
            ],
            temperature: 0.7,
        });

        const replyText = chatCompletion.choices[0].message.content || "Sorry, I couldn't process that.";

        // 7. Return TwiML (XML)
        // Twilio expects an XML response to know what to reply to the user.
        const twiml = `
    <Response>
        <Message>${replyText}</Message>
    </Response>
    `;

        return new Response(twiml, {
            headers: { "Content-Type": "text/xml" },
        });

    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(`
    <Response>
        <Message>Sorry, I encountered an error. Please try again later.</Message>
    </Response>`, {
            headers: { "Content-Type": "text/xml" },
            status: 200 // Return 200 so Twilio doesn't retry infinitely
        });
    }
})
