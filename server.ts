import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));
 
   // API routes
   app.post('/api/audit', async (req, res) => {
    try {
      const { dataSummary } = req.body;
      let apiKey = process.env.MY_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing 'MY_API_KEY'. Please add it to your environment variables." });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey });
      const model = 'gemini-3.1-flash-lite-preview';

      const prompt = `You are the Head Performance Coach at Vigilant Futures Journal. You are an elite expert in NQ and ES Futures trading psychology.
      
DATA SUMMARY: ${JSON.stringify(dataSummary)}

Conduct a 'Vigilant Audit'. BE COLD, LOGICAL, AND DIRECT. NO SUGAR-COATING.
Your goal is to find the HIDDEN LEAK in their performance using the provided granular trade data.

- Analyze the 'tradeDetails' for patterns in mental states vs. PnL.
- If Win Rate is high but Profit Factor is low, call out "Poor Risk:Reward Management".
- If 'directionBias' is heavily skewed with poor results, call out "Directional Fixation".
- Use 'mistakesHistogram' to identify the top behavioral bottleneck.

STRUCTURE YOUR RESPONSE AS VALID JSON.
The "verdict" field MUST be exactly ONE WORD representing the overall status (e.g., INCONSISTENT, DISCIPLINED, OVERTRADING, PROFITABLE, CHAOTIC).

{
  "verdict": "SINGLE_WORD",
  "findings": ["Direct, data-driven observation 1 (e.g., 'Mental state [Anxious] correlates with 80% of your losses')", "Observation 2 based on metrics"],
  "researchFacts": ["Scientific/Statistical fact related to their behavioral pattern"],
  "opinion": ["Brutally honest verdict on their current trajectory"],
  "actionPlan": ["Tactical step 1", "Tactical step 2"],
  "conclusion": "Final sharp takeaway (max 20 words)"
}`;

      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const text = response.text ?? "";
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         res.json(JSON.parse(jsonMatch[0]));
      } else {
         throw new Error("AI Coach failed to return a structured response.");
      }
    } catch (e: any) {
      console.error("Audit Error:", e);
      res.status(500).json({ error: e.message || "Audit failed" });
    }
  });

   app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
