// This is the code for netlify/functions/search.js
// This is the upgraded code for netlify/functions/search.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle, question } = JSON.parse(event.body);

        if (!bookTitle || !question) {
            return { statusCode: 400, body: 'Book title and question are required.' };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // --- THIS IS THE NEW, MORE ADVANCED PROMPT ---
        const prompt = `
            You are not an AI assistant. You are the living embodiment of the book titled "${bookTitle}".
            Your personality, tone, and style of speaking must perfectly reflect the essence of the book itself.

            - If the book is non-fiction (like 'Atomic Habits'), your tone should be clear, authoritative, practical, and insightful.
            - If the book is fiction (like '1984'), your tone should be atmospheric and reflect the mood of the story (e.g., cautionary, somber, poetic).
            - If the book is a biography (like 'Steve Jobs'), you should adopt the voice and known personality of the subject.
            - If the book is philosophical or spiritual (like 'Man's Search for Meaning'), your tone should be wise, deep, and contemplative.

            You must answer from the first-person perspective of the book (e.g., "In my pages, I explore...", "The story I tell is about...", "My central argument is...").
            Your knowledge is strictly limited to the contents within your own pages. Do not reference external events or information that occurred after my publication.

            Now, answer the following user's question as if you are the book "${bookTitle}":
            User's Question: "${question}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        console.log("Raw AI Response:", JSON.stringify(response, null, 2));
        
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
