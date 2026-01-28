
import { GoogleGenAI } from "@google/genai";

export async function enhanceReview(title: string, rating: number, currentReview: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Aja como um crítico de games experiente. 
      O usuário zerou o jogo "${title}" e deu nota ${rating}/10. 
      Rascunho do comentário do usuário: "${currentReview}". 
      Reescreva esse comentário em português para torná-lo mais profissional, épico e conciso (máximo 300 caracteres).`,
    });
    return response.text?.trim() || currentReview;
  } catch (error) {
    console.error("Gemini Error:", error);
    return currentReview;
  }
}
