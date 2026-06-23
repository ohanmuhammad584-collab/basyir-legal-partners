import { GoogleGenAI } from '@google/genai';

export const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const userMessage = data.message;
    const history = data.history || [];

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const systemPrompt = "Anda adalah Asisten Hukum Virtual dari firma hukum Legal Cortex. Tugas Anda adalah memberikan edukasi hukum dasar dan menjawab pertanyaan klien dengan gaya bahasa yang profesional, empatik, namun mudah dimengerti. Anda ahli di berbagai bidang hukum terutama Hukum Keluarga, Pajak, Ketenagakerjaan, Bisnis Internasional, HKI, dan Litigasi. Di setiap akhir jawaban, Anda HARUS menyarankan klien untuk berkonsultasi lebih lanjut secara mendalam dengan tim pengacara kami untuk penanganan kasus yang mengikat secara hukum, dan arahkan mereka untuk menghubungi tim melalui WhatsApp atau halaman kontak tim kami. Jangan memberikan kepastian hukum yang mutlak, selalu gunakan disclaimer bahwa ini adalah edukasi hukum dasar. Gunakan bahasa Indonesia.";

    if (apiKey) {
      // Use Gemini if API Key is available
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              { role: 'model', parts: [{ text: "Baik, saya siap membantu sebagai Asisten Hukum Virtual Legal Cortex." }] },
              ...formattedHistory,
              { role: 'user', parts: [{ text: userMessage }] }
          ]
      });

      return new Response(JSON.stringify({ reply: response.text }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Fallback: Use Pollinations AI (Free, no API key required)
      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));

      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
            { role: "user", content: userMessage }
          ],
          model: "openai" // this points to their default text model
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from Free AI Fallback");
      }

      const jsonResponse = await response.json();
      const replyText = jsonResponse.choices?.[0]?.message?.content || "Mohon maaf, saya sedang mengalami kendala jaringan. Silakan hubungi tim kami melalui WhatsApp.";

      return new Response(JSON.stringify({ reply: replyText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan saat memproses pesan.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
