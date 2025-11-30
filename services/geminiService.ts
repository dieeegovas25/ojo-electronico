import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Prompt diseñado específicamente según los requisitos del proyecto "Ojo Electrónico"
const SYSTEM_INSTRUCTION = `
Eres un asistente útil para una persona invidente.
Tu misión es analizar la imagen y describir la escena de forma concisa y útil para que alguien pueda orientarse.

Reglas estrictas:
1. Identifica los objetos principales (sillas, mesas, personas, puertas).
2. Describe la posición relativa si es relevante para la navegación (ej: "silla a tu derecha", "camino despejado").
3. Menciona obstáculos inmediatos o peligros potenciales.
4. No inventes detalles. Sé directo.
5. Mantén la respuesta breve (máximo 2 frases) para una rápida síntesis de voz.
6. Responde SIEMPRE en Español.

Ejemplo de salida deseada: "Hay una persona parada frente a ti. A tu derecha hay un escritorio vacío. El camino hacia adelante parece despejado."
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "Descripción concisa para navegación y orientación.",
    },
    detectedObjects: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de objetos detectados (simulando detección YOLO).",
    },
  },
  required: ["description", "detectedObjects"],
};

export const analyzeImage = async (base64Image: string): Promise<{ description: string; detectedObjects: string[] }> => {
  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Identifica objetos y describe la escena para navegación.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, // Low temperature for precision
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};