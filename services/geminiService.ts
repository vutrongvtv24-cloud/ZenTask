
import { GoogleGenAI, Type } from "@google/genai";
import { AIPlanResponse, TaskPriority, TaskCategory } from "../types";

// Initialize the GoogleGenAI client with the API key from environment variables.
// The apiKey property must be provided as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTaskPlan = async (goal: string): Promise<AIPlanResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy giúp tôi lập kế hoạch cho mục tiêu này bằng tiếng Việt: "${goal}". 
      Hãy chia nhỏ mục tiêu này thành các công việc cụ thể, cung cấp một mô tả ngắn gọn về cách thực hiện cho mỗi việc, gán mức độ ưu tiên và phân loại phù hợp.`,
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
                  title: { type: Type.STRING, description: "Tiêu đề công việc ngắn gọn" },
                  description: { type: Type.STRING, description: "Mô tả ngắn gọn về cách thực hiện công việc này" },
                  priority: { 
                    type: Type.STRING, 
                    enum: Object.values(TaskPriority),
                    description: "Mức độ ưu tiên" 
                  },
                  category: { 
                    type: Type.STRING, 
                    enum: Object.values(TaskCategory),
                    description: "Phân loại công việc" 
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

    // Access the text property directly on the GenerateContentResponse object.
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIPlanResponse;
  } catch (error) {
    console.error("Error generating tasks:", error);
    return null;
  }
};

export const suggestPriority = async (taskTitle: string): Promise<TaskPriority> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Phân tích độ quan trọng của công việc: "${taskTitle}". Trả về LOW, MEDIUM, hoặc HIGH. Chỉ trả về 1 từ duy nhất.`,
            config: {
                maxOutputTokens: 10,
                temperature: 0.1
            }
        });
        // Accessing response.text directly as it is a getter.
        const priority = response.text?.trim().toUpperCase();
        if (Object.values(TaskPriority).includes(priority as TaskPriority)) {
            return priority as TaskPriority;
        }
        return TaskPriority.MEDIUM;
    } catch {
        return TaskPriority.MEDIUM;
    }
}