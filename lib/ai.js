import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

// Initialize clients
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const xAI = XAI_API_KEY ? new OpenAI({
    apiKey: XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
}) : null;

export async function generateWithAI(prompt) {
    // 1. Try Grok (xAI) if key is available
    if (xAI && XAI_API_KEY) {
        try {
            const response = await xAI.chat.completions.create({
                model: "grok-beta",
                messages: [{ role: "user", content: prompt }],
            });

            // Wrap in a compatible structure
            return {
                modelName: "grok-beta",
                result: {
                    response: {
                        text: () => response.choices[0].message.content,
                    },
                },
            };
        } catch (error) {
            console.error("Grok Error:", error);
            if (!genAI) throw error;
            console.log("Falling back to Gemini...");
        }
    }

    // 2. Fallback to Gemini if available
    if (genAI && GEMINI_API_KEY) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
            const result = await model.generateContent(prompt);
            return {
                modelName: "gemini-1.5-flash",
                result,
            };
        } catch (error) {
            console.error("Gemini Error:", error);
            // Try gemini-pro as last resort
            try {
                const proModel = genAI.getGenerativeModel({ model: "gemini-pro" });
                const proResult = await proModel.generateContent(prompt);
                return {
                    modelName: "gemini-pro",
                    result: proResult,
                };
            } catch (proError) {
                throw proError;
            }
        }
    }

    throw new Error("No AI API keys configured (XAI_API_KEY or GEMINI_API_KEY)");
}
