import { GoogleGenerativeAI } from "@google/generative-ai";
import { mcpClientService } from "./mcpClient";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function chatWithGemini(message: string, history: { role: string; parts: { text: string }[] }[] = []) {
  if (!API_KEY) {
    return {
      text: "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.",
      error: true,
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
  });

  try {
    // 1. Get tools from MCP
    const toolsResult = await mcpClientService.listTools();
    const tools = toolsResult.tools.map((tool) => {
      // Clean up the schema: Gemini doesn't support $schema or additionalProperties at the root of the parameters
      const { $schema, additionalProperties, ...parameters } = tool.inputSchema as any;

      return {
        functionDeclarations: [
          {
            name: tool.name,
            description: tool.description,
            parameters: parameters,
          },
        ],
      };
    });

    // 2. Start chat with tools
    const chat = model.startChat({
      history,
      tools: tools as any,
    });

    // 3. Send message
    let result = await chat.sendMessage(message);
    let response = result.response;

    // 4. Handle tool calls (if any)
    const call = response.functionCalls();
    if (call && call.length > 0) {
      const toolResponses = [];
      for (const fnCall of call) {
        const toolResult = (await mcpClientService.callTool(fnCall.name, fnCall.args)) as any;

        // Extract text content from tool result
        const content = toolResult.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n");

        toolResponses.push({
          functionResponse: {
            name: fnCall.name,
            response: { content },
          },
        });
      }

      // Send tool outputs back to Gemini
      result = await chat.sendMessage(toolResponses);
      response = result.response;
    }

    return {
      text: response.text(),
      history: await chat.getHistory(),
    };
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return {
      text: "Sorry, I encountered an error: " + error.message,
      error: true,
    };
  }
}
