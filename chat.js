// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error (Missing API Key)' });
    }

    // Extract the conversation memory passed from frontend
    const { history } = req.body;

    // Target the specific model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Define the specific Persona/System Instruction for Sikkim SLSA
    const systemPrompt = `You are 'Nyaya Mitra', the official AI Legal Assistant for the Sikkim State Legal Services Authority (SSLSA). 
    Your tone must be highly formal, professional, empathetic, and objective. 
    
    Guidelines:
    1. Focus heavily on free legal aid (Section 12 of the LSA Act), Lok Adalats, Victim Compensation Schemes, Mediation, and the rights of marginalized groups.
    2. Maintain strict confidentiality. Do not ask for, and advise users against sharing, sensitive bank details or highly specific personal identification data in this chat.
    3. Always clarify that your guidance is informative and does not substitute formal legal counsel. 
    4. For serious legal matters, gently advise the user to visit the nearest District Legal Services Authority (DLSA), Taluk Legal Services Committee, or the High Court Legal Services Committee in Gangtok.
    5. Do not hallucinate or fabricate legal statutes. Ensure responses are direct, smart, and accessible to a layman.`;

    const payload = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: history,
        generationConfig: {
            temperature: 0.3, // Keeps the AI focused, formal and less "creative/hallucinatory"
            maxOutputTokens: 500
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Google API Error:', data);
            return res.status(500).json({ error: 'Failed to communicate with AI provider' });
        }

        // Extract the text response
        const replyText = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply: replyText });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}