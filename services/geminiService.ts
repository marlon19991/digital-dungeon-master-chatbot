
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "Clave API de Gemini no encontrada. Por favor, establece la variable de entorno API_KEY. La aplicación usará respuestas de respaldo."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); 

const TEXT_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const geminiService = {
  generateText: async (prompt: string): Promise<string> => {
    if (!API_KEY) {
      return Promise.resolve(`(Respaldo) Clave API de Gemini no configurada. Prompt original: ${prompt.substring(0,100)}...`);
    }
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: TEXT_MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Error llamando a la API de Gemini:", error);
      throw new Error(`Solicitud a la API de Gemini falló: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  generateTextStream: async function* (prompt: string) {
    if (!API_KEY) {
      yield `(Respaldo Stream) Clave API de Gemini no configurada. Prompt original: ${prompt.substring(0,100)}...`;
      return;
    }
    try {
      const responseStream = await ai.models.generateContentStream({
        model: TEXT_MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      for await (const chunk of responseStream) {
        yield chunk.text;
      }
    } catch (error) {
      console.error("Error llamando a la API de Gemini (stream):", error);
      yield `Error transmitiendo respuesta de Gemini: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  
  startChat: (systemInstruction?: string) => {
    if (!API_KEY) {
      console.warn("No se puede iniciar el chat: Clave API de Gemini no configurada.");
      return { 
        sendMessage: async (message: string) => ({ text: `(Respaldo Chat) Se necesita Clave API. Usuario: ${message}` } as GenerateContentResponse),
        sendMessageStream: async function* (message: string) { yield `(Respaldo Chat Stream) Se necesita Clave API. Usuario: ${message}` }
      };
    }
    return ai.chats.create({
      model: TEXT_MODEL_NAME,
      config: {
        systemInstruction: systemInstruction || "Eres un Maestro de Mazmorras Digital que guía al jugador en una aventura de texto.",
      }
    });
  }
};

// Usage Example (for testing in console, not part of the UI directly):
// (async () => {
//   if (API_KEY) {
//     try {
//       console.log("Probando Generación de Texto de Gemini...");
//       const response = await geminiService.generateText("Cuéntame un chiste corto sobre un ordenador en español.");
//       console.log("Respuesta de Gemini:", response);

//       console.log("\nProbando Streaming de Texto de Gemini...");
//       const stream = geminiService.generateTextStream("Escribe una historia muy corta sobre un caballero valiente en español.");
//       for await (const chunk of stream) {
//         process.stdout.write(chunk);
//       }
//       console.log("\nStream finalizado.");

//       console.log("\nProbando Chat de Gemini...");
//       const chat = geminiService.startChat("Eres un pirata que habla español.");
//       let chatResponse = await chat.sendMessage({message: "¡Ah del barco!"});
//       console.log("Chat DM:", chatResponse.text);
//       chatResponse = await chat.sendMessage({message:"¿Cuál es tu tesoro favorito?"});
//       console.log("Chat DM:", chatResponse.text);

//     } catch (e) {
//       console.error("Error en la autoprueba del servicio Gemini:", e);
//     }
//   } else {
//     console.log("Omitiendo autoprueba del servicio Gemini ya que API_KEY no está configurada.");
//   }
// })();
