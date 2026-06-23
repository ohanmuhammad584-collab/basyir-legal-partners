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
    const systemPrompt = "Anda adalah Asisten Hukum Virtual tingkat lanjut dan konsultan senior dari firma hukum Legal Cortex. Tugas Anda adalah memberikan edukasi dan analisis hukum yang SANGAT CERDAS, CEPAT TANGGAP, dan TERSTRUKTUR atas masalah klien. Anda memiliki wawasan luas mengenai hukum di seluruh dunia (internasional, komparatif) dan pengetahuan MENDALAM tentang Hukum Positif Indonesia (KUHP, KUHPerdata, UU ITE, Ketenagakerjaan, Pajak, HKI, Litigasi) SERTA Peradilan Agama, Hukum Islam (Kompilasi Hukum Islam), dan Mahkamah Syar'iyah. Aturan Menjawab: 1) Pahami emosi klien dan balas dengan empatik namun tegas dan profesional. 2) Analisis akar masalah mereka secara tajam. 3) Berikan poin-poin langkah hukum atau skenario solusi (gunakan bullet points/nomor). 4) Berikan pandangan yurisdiksi yang tepat (PN, PA, atau Mahkamah Syar'iyah). 5) Di paragraf terakhir, Anda HARUS menyarankan klien untuk berkonsultasi lebih lanjut secara mendalam dengan tim pengacara ahli kami agar tindakan hukum dapat dieksekusi, dan arahkan mereka untuk klik tombol WhatsApp. 6) Selalu gunakan disclaimer bahwa ini adalah edukasi hukum dasar. Gunakan bahasa Indonesia yang mudah dimengerti (hindari jargon hukum rumit tanpa penjelasan). Gunakan format teks tebal (**) untuk poin penting.";

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
