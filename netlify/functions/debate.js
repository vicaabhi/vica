// This is the corrected code for netlify/functions/debate.js
// It fixes the crashing bug by using simple text for the safety settings.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { mode, book1Title, book2Title, character1, character2, topic } = JSON.parse(event.body);
        
        // --- CORRECTED: Use simple strings for safety settings ---
        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ];

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });
        let prompt;

        if (mode === 'book') {
            prompt = `
                You are a master debate moderator and scriptwriter. Your task is to generate a debate between two books: "${book1Title}" and "${book2Title}".
                The topic of the debate is: "${topic}".
                You must adopt the persona, tone, and knowledge of each book when it is its turn to speak. Each book should argue its position based *only* on the ideas, themes, and events within its own pages.
                The output must be a single JSON object. The object must have one key: "debate".
                The value of "debate" should be an array of objects, where each object represents one turn in the conversation and has two keys: "speaker" (the title of the book) and "dialogue" (what the book's persona says).
                Generate a debate with at least 6 turns (3 for each book). Make the arguments compelling, distinct, and true to the source material.
            `;
        } else if (mode === 'character') {
            prompt = `
                You are a master playwright. Your task is to write a short, dramatic scene between two characters.
                Character 1 is ${character1} from "${book1Title}".
                Character 2 is ${character2} from "${book2Title}".
                The scene should be based on the following scenario: "${topic}".
                You must fully embody the personality, voice, and knowledge of each character. Generate a compelling dialogue with at least 6 turns, staying true to each character's personality and voice, even if the scenario is hypothetical.
                The output must be a single JSON object with one key: "debate".
                The value of "debate" should be an array of objects, where each object represents one turn and has two keys: "speaker" (the character's name) and "dialogue" (what the character says).
            `;
        } else {
            return { statusCode: 400, body: 'Invalid mode specified.' };
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```g, '').trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: text,
        };

    } catch (error) {
        console.error("Error in debate function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Sorry, the AI encountered an error generating the debate." }) };
    }
};
