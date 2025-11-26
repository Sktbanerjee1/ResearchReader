import { GoogleGenAI } from "@google/genai";
import { Source, ResearchUpdate } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

export const fetchResearchBriefing = async (topic: string, days: number = 30): Promise<Omit<ResearchUpdate, 'id' | 'timestamp'>> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Enhanced prompt to force domain identification and source selection
    const prompt = `
      You are an elite Research Scout. The user is tracking the scientific field: "${topic}".
      
      **Goal**: Find the 4-6 most significant primary research papers published in the last ${days} days.
      
      **CRITICAL - LINK VERIFICATION RULES**:
      1. **DIRECT LINKS ONLY**: You must provide a direct URL to the specific article, abstract, or PDF (e.g., specific DOI link, arxiv.org/abs/..., nature.com/articles/...).
      2. **NO GENERIC LINKS**: Do NOT use journal homepages (e.g., "nature.com") or search result pages.
      3. **VERIFY**: If you cannot find a direct, working URL for a specific paper, **DO NOT INCLUDE IT**. It is better to return fewer high-quality results than broken links.
      
      **Sources Strategy**:
      - Biomedical: PubMed, Nature Medicine, The Lancet, JAMA, bioRxiv.
      - CS/AI: ArXiv, Hugging Face Papers, NeurIPS/ICLR/CVPR proceedings, IEEE Xplore.
      - Physics/Chem: APS, ACS, Science, Nature, arXiv.
      - General Science: ScienceDaily, EurekAlert (only if linking to source paper).

      **Output Format (Strict Markdown)**:
      # Research Update: ${topic}
      
      > *Scanning sources for the last ${days} days...*
      
      ---
      
      ## Paper Title
      **Source**: *Journal/Conference Name* | **Date**: *YYYY-MM-DD*
      
      (Concise 2-3 sentence abstract focusing on the methodology and key result.)
      
      **Impact**: (One sentence on why this is significant.)
      
      [Read Full Paper →](DIRECT_URL_HERE)
      
      ---
      
      ## Next Paper Title
      ...
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType and responseSchema are NOT allowed with googleSearch
        systemInstruction: "You are a specialized scientific research assistant. Your output must be technically accurate. You must ONLY include papers where you can provide a verified, working URL to the specific paper/abstract. Do not hallucinate links.",
      },
    });

    const text = response.text || "No content generated.";
    
    // Extract grounding chunks (sources)
    const sources: Source[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri,
          });
        }
      });
    }

    // De-duplicate sources
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(v2 => (v2.uri === v.uri)) === i);

    return {
      content: text,
      sources: uniqueSources,
    };

  } catch (error) {
    console.error("Error fetching research briefing:", error);
    throw error;
  }
};