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
      
      **Goal**: Find the latest (last ${days} days) primary research papers, pre-prints, and scientific publications.
      
      **CRITICAL INSTRUCTION FOR LINKS**:
      - You MUST include a valid, direct URL for every paper listed.
      - **VERIFY THE URL**: The URL must point to the specific article, abstract, or PDF. Do NOT use generic journal homepages.
      - **ACCURACY**: If you cannot find a specific, direct link to the source, DO NOT include the paper in the list.
      - **Google Search**: Use the search tool to explicitly find the official URL for each paper title you discover.

      **Strategy**:
      1. **Determine the Domain & Sources**:
         - If Biomedical/Medical: Prioritize PubMed, Nature Medicine, The Lancet, JAMA, bioRxiv.
         - If Computer Science/AI: Prioritize ArXiv, Hugging Face Papers, NeurIPS/ICLR proceedings, IEEE Xplore.
         - If Physics/Chem: Prioritize APS, ACS, Science, Nature, arXiv.
         - If Social Science: Prioritize SSRN, JSTOR, Sage.
         - (Adapt for other fields accordingly).
      
      2. **Execute Search**: Use the Google Search tool to find *specific, named papers* released recently (within the last ${days} days) in these sources.
      
      3. **Compile Briefing**:
         - Select the top 3-6 most impactful papers.
         - **MANDATORY**: You MUST provide a direct link to the paper, abstract, or DOI for every item.
         - Do not output generic news summaries unless they link to a study.
      
      **Output Format (Markdown)**:
      # Research Update: ${topic} (${days} Days)
      
      > *Scanning Sources: [List the specific journals/repos you targeted]*
      
      ## [Title of the Research Paper](URL_HERE)
      **Source**: *Journal Name* | **Date**: *Date*
      
      **Abstract**:
      (Concise technical summary of methodology and results)
      
      **Significance**:
      (Why this paper is important)
      
      ---
      
      ## [Next Paper Title](URL_HERE)
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