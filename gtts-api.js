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

    // Use a more reliable free TTS service
    const ttsUrl = `https://text-to-speech-api.vercel.app/api/tts`;
    
    // Make request to the TTS service
    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice: voice,
        format: format
      })
    });
    
    if (!ttsResponse.ok) {
      throw new Error(`TTS service error: ${ttsResponse.status}`);
    }

    // Get the audio buffer
    const audioBuffer = await ttsResponse.arrayBuffer();
    
    // Verify the audio file is not empty
    if (audioBuffer.byteLength < 100) {
      throw new Error('Generated audio file is too small (likely corrupted)');
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
