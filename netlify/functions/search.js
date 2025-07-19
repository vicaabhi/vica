// This is the code for netlify/functions/search.js

// This is the corrected code for netlify/functions/search.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get the API key from the environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle } = JSON.parse(event.body);

        if (!bookTitle) {
            return { statusCode: 400, body: 'Book title is required.' };
        }

        // CORRECTED MODEL NAME
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
            You are a sophisticated literary review AI.
            Generate a detailed review for the book: "${bookTitle}".
            The review must be in JSON format. The JSON object must have the following keys: "title", "author", "summary", "pros", "cons", "quotes".
            - summary: A detailed 5-6 line summary.
            - pros: An array of 2 strings, where each string is a detailed pro.
            - cons: An array of 2 strings, where each string is a detailed con.
            - quotes: An array of 2 strings, where each string is a famous quote from the book.
            Do not include any text or formatting outside of the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: cleanedText,
        };

    } catch (error) {
        console.error("Error generating review:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate review." }),
        };
    }
};
