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

    // Use Gemini API
    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // If no API key is provided, return a mock response instead of an error so the user sees it "running"
      return new Response(JSON.stringify({ 
        reply: "*(Mode Simulasi)* Halo! Saya Asisten Hukum Virtual dari Legal Cortex. Saat ini sistem AI saya sedang dalam mode demonstrasi karena 'Kunci API' belum dipasang oleh administrator. Meskipun begitu, Anda selalu dapat mengklik tombol 'Lewati & Chat WhatsApp Sekarang' di bawah untuk terhubung langsung dengan Tim Pengacara ahli kami!" 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Format history for Gemini
    // Format: { role: 'user' | 'model', parts: [{text: '...'}] }
    const formattedHistory = history.map((msg) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // System prompt as context message
    const systemPrompt = "Anda adalah Asisten Hukum Virtual dari firma hukum Legal Cortex. Tugas Anda adalah memberikan edukasi hukum dasar dan menjawab pertanyaan klien dengan gaya bahasa yang profesional, empatik, namun mudah dimengerti. Anda ahli di berbagai bidang hukum terutama Hukum Keluarga, Pajak, Ketenagakerjaan, Bisnis Internasional, HKI, dan Litigasi. Di setiap akhir jawaban, Anda HARUS menyarankan klien untuk berkonsultasi lebih lanjut secara mendalam dengan tim pengacara kami untuk penanganan kasus yang mengikat secara hukum, dan arahkan mereka untuk menghubungi tim melalui WhatsApp atau halaman kontak tim kami. Jangan memberikan kepastian hukum yang mutlak, selalu gunakan disclaimer bahwa ini adalah edukasi hukum dasar.";

    // Using gemini-2.5-flash as the fast modern model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Baik, saya mengerti peran saya sebagai Asisten Hukum Virtual Legal Cortex." }] },
            ...formattedHistory,
            { role: 'user', parts: [{ text: userMessage }] }
        ]
    });

    const replyText = response.text || "Mohon maaf, saya sedang mengalami kendala jaringan. Silakan hubungi tim kami melalui WhatsApp.";

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan saat memproses pesan.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
