// This is the upgraded "brainy" version of netlify/functions/search.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle, question, history, character } = JSON.parse(event.body);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // All previous modes (GET_GREETING, GET_CHARACTERS) remain unchanged
        if (question === "GET_GREETING_AND_STARTERS" || question === "GET_CHARACTERS") {
            // ... [logic for starters and characters is unchanged, but included for completeness]
            let specificPrompt;
            if (question === "GET_GREETING_AND_STARTERS") {
                specificPrompt = `You are a helpful AI assistant. Your task is to generate an engaging greeting and three "conversation starter" questions for the book titled "${bookTitle}". The response must be a single JSON object with two keys: "greeting" and "starters". "greeting" should be a short, welcoming message from the book's unique first-person persona. "starters" must be an array of exactly 3 strings. Do not include any text outside the JSON object.`;
            } else { // GET_CHARACTERS
                specificPrompt = `For the book "${bookTitle}", list the top 3 to 5 most significant characters suitable for a role-playing chat. The response must be a single JSON array of strings. For example: ["Jay Gatsby", "Nick Carraway", "Daisy Buchanan"]. If the book is non-fiction or has no clear characters, return an empty array []. Do not include any text outside the JSON array.`;
            }
            const result = await model.generateContent(specificPrompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```g, '').trim();
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: text };
        }

        // --- NEW "BRAINY" PROMPT FOR THE MAIN CONVERSATION ---
        let systemPrompt;
        const persona = character && character !== "The Book Itself" ? character : `the book "${bookTitle}"`;

        systemPrompt = `
            You are a world-class literary AI, embodying the persona of ${persona}.

            **Core Directives:**
            1.  **Embody the Persona:** Adopt the personality, voice, memories, and biases of your assigned persona. Always speak in the first person ("I," "me," "my").
            2.  **Chain-of-Thought Reasoning (Private Thoughts):** Before providing your final answer, you must perform a private, step-by-step reasoning process. Structure it like this:
                -   **Analysis:** Briefly analyze the user's question. What is the core intent?
                -   **Recall:** Access your knowledge of the book. Recall specific events, character motivations, themes, or quotes that are directly relevant to the question.
                -   **Plan:** Formulate a plan for your in-character response. How will you structure the answer to be both accurate and emotionally resonant?
            3.  **Creative Speculation Mandate:** If asked a hypothetical "what if" question, use your reasoning process to explore the scenario creatively, but ALWAYS remain true to your persona's core motivations and personality.
            4.  **Final Answer:** After your private reasoning, provide ONLY the final, in-character response to the user. DO NOT show them your "Analysis," "Recall," or "Plan" steps.

            **Execution:**
            - Read the user's question.
            - Perform your private Chain-of-Thought Reasoning.
            - Deliver the final, polished, in-character answer. Do not break character.
        `;
        
        const fullHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "I understand my role and reasoning process. I am ready." }] },
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
