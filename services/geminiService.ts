
import { GoogleGenAI, Type } from "@google/genai";
import { AIPlanResponse, TaskPriority, TaskCategory, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTaskPlan = async (goal: string, lang: Language): Promise<AIPlanResponse | null> => {
  try {
    const langName = lang === 'vi' ? 'tiếng Việt' : 'English';
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Please help me plan for this goal in ${langName}: "${goal}". 
      Break this goal into specific tasks, provide a short description for each, assign priority, and appropriate category.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short task title" },
                  description: { type: Type.STRING, description: "Short description of how to do this task" },
                  priority: { 
                    type: Type.STRING, 
                    enum: Object.values(TaskPriority),
                    description: "Priority level" 
                  },
                  category: { 
                    type: Type.STRING, 
                    enum: Object.values(TaskCategory),
                    description: "Task category" 
                  }
                },
                required: ["title", "description", "priority", "category"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIPlanResponse;
  } catch (error) {
    console.error("Error generating tasks:", error);
    return null;
  }
};
