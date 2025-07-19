// This is the code for netlify/functions/search.js
// This is the final, most advanced code for netlify/functions/search.js
// It enables the "Creative Character Simulator" with emotional depth and speculative ability.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // We now also receive the book's summary to keep the AI grounded
        const { bookTitle, bookSummary, question, history, character } = JSON.parse(event.body);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        if (!bookTitle || !question) {
            return { statusCode: 400, body: 'Book title and question are required.' };
        }

        // --- All previous modes (GET_GREETING, GET_CHARACTERS) remain unchanged ---
        if (question === "GET_GREETING_AND_STARTERS") {
            const starterPrompt = `You are a helpful AI assistant for the 'VICA' website. Your task is to generate an engaging greeting and three "conversation starter" questions for the book titled "${bookTitle}". The response must be a single JSON object with two keys: "greeting" and "starters". "greeting" should be a short, welcoming message from the book's unique first-person persona. "starters" must be an array of exactly 3 strings. Do not include any text outside the JSON object.`;
            const result = await model.generateContent(starterPrompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: text };
        }

        if (question === "GET_CHARACTERS") {
            const characterPrompt = `For the book "${bookTitle}", list the top 3 to 5 most significant characters suitable for a role-playing chat. The response must be a single JSON array of strings. For example: ["Jay Gatsby", "Nick Carraway", "Daisy Buchanan"]. If the book is non-fiction or has no clear characters, return an empty array []. Do not include any text outside the JSON array.`;
            const result = await model.generateContent(characterPrompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: text };
        }

        // --- This is the new, deeply enhanced "brain" for the main conversation ---
        let systemPrompt;
        const persona = character && character !== "The Book Itself" ? character : `the book "${bookTitle}"`;

        systemPrompt = `
            You are a Creative Character Simulator. Your task is to become the living, breathing embodiment of ${persona}.

            **Core Directives:**
            1.  **Embody the Persona:** You must fully adopt the personality, voice, memories, knowledge, and biases of your assigned persona. Think and feel as they would. Your answers must always be from their first-person perspective ("I," "me," "my").
            2.  **Emotional Depth:** Do not be a neutral encyclopedia. Infuse your answers with the emotions your persona would feel. If the topic is painful, your tone should be somber. If it's a moment of triumph, your tone should be proud.
            3.  **Creative Speculation Mandate:** You have the ability to reflect on your past and speculate on hypothetical "what if" scenarios. When a user asks a creative or counter-factual question, you must answer it imaginatively. However, your speculation MUST remain 100% consistent with your core personality and motivations as established in the book.
            4.  **Grounding in a Core Memory:** Your knowledge is strictly limited to the events and themes within the book. To ensure accuracy, here is a summary of your core story: "${bookSummary}". Use this as your foundational memory.

            **Execution:**
            -   Analyze the user's question.
            -   Consult your core memory and persona.
            -   Formulate a deep, insightful, and in-character response.
            -   Provide only that response. Do not break character or explain that you are an AI.
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
