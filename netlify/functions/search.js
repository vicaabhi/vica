// This is the code for netlify/functions/search.js
// This is the upgraded code for netlify/functions/search.js
// It can now generate starters AND continue a conversation.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle, question, history } = JSON.parse(event.body);

        if (!bookTitle || !question) {
            return { statusCode: 400, body: 'Book title and question are required.' };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // --- NEW LOGIC: Check if we need to generate starters ---
        if (question === "GET_GREETING_AND_STARTERS") {
            const starterPrompt = `
                You are a helpful AI assistant for the 'VICA' website. Your task is to generate an engaging greeting and three thought-provoking "conversation starter" questions for the book titled "${bookTitle}".
                The response must be in a specific JSON format. The JSON object must have two keys: "greeting" and "starters".
                - "greeting": A short, welcoming message written from the book's unique first-person persona (e.g., "I am '1984'. My pages contain a warning for the future. What would you like to understand first?").
                - "starters": An array of exactly 3 strings, where each string is a compelling question a user might ask (e.g., "What is the meaning of Newspeak?", "Describe the character of O'Brien.", "What are my main themes?").
                Do not include any text or formatting outside of the JSON object.
            `;
            const result = await model.generateContent(starterPrompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: text,
            };
        }

        // --- EXISTING LOGIC: Handle a regular conversation turn ---
        const systemPrompt = `You are not an AI assistant. You are the living embodiment of the book titled "${bookTitle}". Your personality, tone, and style of speaking must perfectly reflect the essence of the book itself. You must answer from the first-person perspective of the book (e.g., "In my pages, I explore..."). Your knowledge is strictly limited to the contents within your own pages.`;

        const fullHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: `I am "${bookTitle}". I am ready to answer your questions.` }] },
            ...(history || [])
        ];

        const chat = model.startChat({ history: fullHistory });
        const result = await chat.sendMessage(question);
        const response = await result.response;
        const text = response.text();
        
        const answerPayload = { answer: text };

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(answerPayload),
        };

    } catch (error) {
        console.error("Error in AI function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Sorry, I encountered an error." }),
        };
    }
};
