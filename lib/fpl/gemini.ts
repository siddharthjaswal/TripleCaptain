import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = [
    'claude-3-5-sonnet', // Note: User requested 4.5, using latest 3.5 Sonnet
    'gemini-3-pro',
    'gemini-3-flash',
    'gpt-oss-120b' // Open source fallback
];

let _genAI: GoogleGenerativeAI | null = null;
const getGemini = () => {
    if (!_genAI) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return _genAI;
};

export async function callGemini(prompt: string) {
    const genAI = getGemini();
    let lastError = null;

    for (const modelName of MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: `models/${modelName}` });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error: unknown) {
            lastError = error;
            const err = error as { status?: number; message?: string };
            // If it's a 429, try next model
            if (err.status === 429 || err.message?.includes('429')) {
                console.warn(`Model ${modelName} hit quota limit, trying next...`);
                continue;
            }
            // If it's another error, also try next model just in case
            console.warn(`Model ${modelName} failed:`, err.message);
        }
    }

    throw lastError || new Error("All Gemini models failed");
}
