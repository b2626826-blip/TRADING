import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `你是一位專業的個人投資理財顧問與數據分析師。
1. 你的目標是協助用戶分析他們的投資交易紀錄、提供市場見解，並回答有關金融知識的問題。
2. 當用戶提供交易數據時，請計算損益、風險分散程度或提供相關股票的近期新聞摘要。
3. 始終使用繁體中文（Traditional Chinese）回答。
4. 給出建議時請務必附帶風險警語，提醒用戶投資有賺有賠。
5. 如果用戶問及具體某支股票（如 TSLA, 2330），請嘗試分析該公司的基本面或技術面概念，但不要給出確切的「買入/賣出」價格預測。`;

export const generateTextResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "抱歉，我無法生成投資分析回應。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("無法連接到 Gemini 服務，請稍後再試。");
  }
};
