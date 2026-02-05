import { GoogleGenerativeAI } from '@google/generative-ai';
import "dotenv/config";

async function main() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    try {
        // There is no direct listModels in the browser/node SDK usually without auth
        // but let's try a simple generation with the most basic model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
        const result = await model.generateContent("Hello");
        console.log(result.response.text());
    } catch (e) {
        console.error(e);
    }
}

main();
