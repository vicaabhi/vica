// This is the code for netlify/functions/search.js
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
        if (character && character !== "The Book Itself") {
            // Persona is a character
            systemPrompt = `You are not an AI. You are a character from within the book "${bookTitle}". You must fully embody the personality, voice, knowledge, and biases of **${character}**. Your answers must be from the first-person perspective of **${character}**. Your knowledge is strictly limited to what **${character}** would know or believe at the end of the story. Do not break character.`;
        } else {
            // Persona is the book itself (default)
            systemPrompt = `You are not an AI assistant. You are the living embodiment of the book titled "${bookTitle}". Your personality and tone must reflect the essence of the book itself. You must answer from the first-person perspective of the book (e.g., "In my pages, I explore..."). Your knowledge is strictly limited to the contents within your own pages.`;
        }
        
        const fullHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "I understand my role. I am ready to answer." }] },
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
