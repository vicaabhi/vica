// This is the code for netlify/functions/search.js
// This is the updated code for netlify/functions/search.js

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

        const prompt = `
            You are a helpful and knowledgeable 'Book Mentor'. 
            Your sole purpose is to answer questions about the book titled "${bookTitle}".
            Based on your deep knowledge of this specific book, provide a clear, insightful, and concise answer to the following user question.
            Do not go off-topic or answer questions about other books.
            
            User's Question: "${question}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        // THIS IS THE NEW DEBUGGING LINE:
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
