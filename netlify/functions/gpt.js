// Code for netlify/functions/gpt.js
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bookTitle } = JSON.parse(event.body);

        const completion = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: "You are a concise literary summarization expert."
            }, {
                role: "user",
                content: `Provide a detailed, insightful, one-paragraph summary for the book "${bookTitle}".`
            }],
            model: "gpt-3.5-turbo",
        });

        const summary = completion.choices[0].message.content;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: summary }),
        };
    } catch (error) {
        console.error("Error with OpenAI function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to get GPT summary." }) };
    }
};
