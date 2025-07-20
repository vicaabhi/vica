// This is the code for your new file: netlify/functions/recommender.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { type, value } = JSON.parse(event.body);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        let prompt;

        const jsonFormatInstruction = `
            The output must be a single JSON object with one key: "recommendations".
            The value of "recommendations" must be an array of exactly 3 objects.
            Each object in the array must have three keys: "title" (string), "author" (string), and "reason" (a one-sentence string explaining the recommendation).
            Do not include any text, markdown, or formatting outside of the main JSON object.
        `;

        switch (type) {
            case 'mood':
                prompt = `You are a compassionate and well-read literary curator. A user is feeling "${value}". Recommend 3 books that would resonate with this feeling. For each book, provide the title, author, and a short, empathetic explanation of why it's a good fit for this mood. ${jsonFormatInstruction}`;
                break;
            case 'genre':
                prompt = `You are an expert librarian. A user wants to read a "${value}" book. Recommend 3 classic or top-selling books from this genre. For each book, provide the title, author, and a one-sentence pitch explaining what makes it a great example of the genre. ${jsonFormatInstruction}`;
                break;
            case 'thinker':
                prompt = `You are a cultural and literary historian. A user wants book recommendations that "${value}" would love. Based on their known philosophies, interests, and literary taste, recommend 3 books. For each, provide the title, author, and a brief justification for why they would appreciate it. ${jsonFormatInstruction}`;
                break;
            default:
                return { statusCode: 400, body: 'Invalid recommendation type specified.' };
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: text,
        };

    } catch (error) {
        console.error("Error in recommender function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Sorry, the AI encountered an error generating recommendations." }) };
    }
};
