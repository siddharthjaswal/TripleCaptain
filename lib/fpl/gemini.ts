import { GoogleGenerativeAI } from '@google/generative-ai';

const PRIMARY_MODEL = 'gemini-3-pro';
const FALLBACK_MODEL = 'gemini-2.5-flash';

let _genAI: GoogleGenerativeAI | null = null;
const getGemini = () => {
    if (!_genAI) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return _genAI;
};

export async function callGemini(prompt: string) {
    const genAI = getGemini();
    try {
        const model = genAI.getGenerativeModel({ model: `models/${PRIMARY_MODEL}` });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.warn(`Primary model (${PRIMARY_MODEL}) failed, trying fallback (${FALLBACK_MODEL}):`, error);
        const model = genAI.getGenerativeModel({ model: `models/${FALLBACK_MODEL}` });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
}
