// This is the upgraded "brainy" version of netlify/functions/debate.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { mode, book1Title, book2Title, character1, character2, topic } = JSON.parse(event.body);
        
        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ];

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });
        let prompt;

        // The prompts now include Chain-of-Thought instructions for higher quality output
        if (mode === 'book') {
            prompt = `You are a master debate moderator. Your task is to generate a debate between "${book1Title}" and "${book2Title}" on the topic: "${topic}".
            For each turn, first perform a private "Chain-of-Thought" reasoning: 1. Analyze the current state of the debate. 2. Recall core principles from the book whose turn it is. 3. Formulate a compelling argument or rebuttal in that book's persona.
            Then, provide only the final dialogue.
            The output must be a JSON object with one key: "debate". The value must be an array of objects, each with a "speaker" and "dialogue" key. Generate at least 6 turns.`;
        } else if (mode === 'character') {
            prompt = `You are a master playwright. Your task is to write a short, dramatic scene between ${character1} (from "${book1Title}") and ${character2} (from "${book2Title}"), based on the scenario: "${topic}".
            For each line of dialogue, first perform a private "Chain-of-Thought" reasoning: 1. Analyze the character's emotional state and motivation. 2. Recall their personality from the book. 3. Craft a line of dialogue that is powerful, authentic, and moves the scene forward.
            Then, provide only the final dialogue.
            The output must be a JSON object with one key: "debate". The value must be an array of objects, each with a "speaker" (the character's name) and "dialogue" key. Generate at least 6 turns.`;
        } else {
            return { statusCode: 400, body: 'Invalid mode specified.' };
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

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
