// TTS API Service for n8n WhatsApp Workflow
// Deploy this to Vercel for free TTS service

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'en', format = 'mp3' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Validate text length
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    // Use a more reliable free TTS service - Google Translate TTS
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${voice}&client=tw-ob`;
    
    // Fetch the audio from Google Translate TTS
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TTS service error: ${response.status}`);
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Verify the audio file is not empty
    if (audioBuffer.byteLength < 1000) {
      throw new Error(`Generated audio file is too small: ${audioBuffer.byteLength} bytes (expected > 1000 bytes)`);
    }
    
    // Return audio file
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="voice_message.mp3"`);
    res.setHeader('Content-Length', audioBuffer.byteLength);
    
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('TTS API Error:', error);
    
    res.status(500).json({ 
      error: 'Failed to generate audio',
      details: error.message 
    });
  }
}
