// This is the code for netlify/functions/search.js
// This is the upgraded code for netlify/functions/search.js to handle conversation history

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle, question, history } = JSON.parse(event.body);

        if (!bookTitle || !question || !history) {
            return { statusCode: 400, body: 'Book title, question, and history are required.' };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // The initial "persona" prompt is now part of the history
        const systemPrompt = `You are not an AI assistant. You are the living embodiment of the book titled "${bookTitle}". Your personality, tone, and style of speaking must perfectly reflect the essence of the book itself. You must answer from the first-person perspective of the book (e.g., "In my pages, I explore..."). Your knowledge is strictly limited to the contents within your own pages. Do not reference external events.`;

        // We combine the system prompt with the chat history from the user
        const fullHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: `I am "${bookTitle}". I am ready to answer your questions.` }] },
            ...history
        ];

        const chat = model.startChat({
            history: fullHistory,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(question);
        const response = await result.response;
        const text = response.text();
        
        const answerPayload = {
            answer: text
        };

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(answerPayload),
        };

    } catch (error) {
        console.error("Error generating answer:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Sorry, I encountered an error trying to answer that question." }),
        };
    }
};
