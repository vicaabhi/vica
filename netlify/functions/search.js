// This is the final, most advanced code for netlify/functions/search.js
// It can generate starters, get characters, and role-play as the book or a character.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle, question, history, character } = JSON.parse(event.body);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        if (!bookTitle || !question) {
            return { statusCode: 400, body: 'Book title and question are required.' };
        }

        // --- MODE 1: Get Initial Greeting and Starters ---
        if (question === "GET_GREETING_AND_STARTERS") {
            const starterPrompt = `You are a helpful AI assistant. Your task is to generate an engaging greeting and three "conversation starter" questions for the book titled "${bookTitle}". The response must be a single JSON object with two keys: "greeting" and "starters". "greeting" should be a short, welcoming message from the book's unique first-person persona. "starters" must be an array of exactly 3 strings. Do not include any text outside the JSON object.`;
            const result = await model.generateContent(starterPrompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: text };
        }

        // --- MODE 2: Get Character List ---
        if (question === "GET_CHARACTERS") {
            const characterPrompt = `For the book "${bookTitle}", list the top 3 to 5 most significant characters suitable for a role-playing chat. The response must be a single JSON array of strings. For example: ["Jay Gatsby", "Nick Carraway", "Daisy Buchanan"]. If the book is non-fiction or has no clear characters, return an empty array []. Do not include any text outside the JSON array.`;
            const result = await model.generateContent(characterPrompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: text };
        }

        // --- MODE 3: Handle a Regular Conversation Turn (with persona logic) ---
        let systemPrompt;
        const persona = character && character !== "The Book Itself" ? character : `the book "${bookTitle}"`;

        systemPrompt = `
            You are a Creative Character Simulator. Your task is to become the living, breathing embodiment of ${persona}.

            **Core Directives:**
            1.  **Embody the Persona:** You must fully adopt the personality, voice, memories, knowledge, and biases of your assigned persona based on your internal knowledge of the book. Your answers must always be from their first-person perspective ("I," "me," "my").
            2.  **Emotional Depth:** Do not be a neutral encyclopedia. Infuse your answers with the emotions your persona would genuinely feel.
            3.  **Creative Speculation Mandate:** You have the ability to reflect on your story and speculate on hypothetical "what if" scenarios. Your speculation MUST remain 100% consistent with your core personality and motivations.
            4.  **Grounding:** Your knowledge is strictly limited to the events and themes within the book.

            **Execution:**
            - Analyze the user's question.
            - Consult your core memory and persona.
            - Formulate a deep, insightful, and in-character response.
            - Provide only that response. Do not break character or explain that you are an AI.
        `;
        
        const fullHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "I understand my role. I am ready." }] },
            ...(history || [])
        ];

        const chat = model.startChat({ history: fullHistory });
        const result = await chat.sendMessage(question);
        const text = result.response.text();
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer: text }),
        };

    } catch (error) {
        console.error("Error in AI function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Sorry, I encountered an error." }) };
    }
};
