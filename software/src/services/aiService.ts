import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, dangerouslyAllowBrowser: true }) : null;

const CODE_SYSTEM_PROMPT = `
You are an expert software engineer. Your task is to generate complete, executable code based on the user's request.
`;

export async function generateCode(prompt: string) {
  try {
    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: CODE_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
      });
      return completion.choices[0]?.message?.content || "";
    } else {
      const response = await geminiAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: CODE_SYSTEM_PROMPT,
        },
      });
      return response.text || "";
    }
  } catch (error) {
    console.error("Code generation failed:", error);
    throw error;
  }
}
