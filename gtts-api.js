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

    // Use a free TTS service that works on Vercel
    const ttsUrl = `https://api.voicerss.org/?key=demo&hl=${voice}&src=${encodeURIComponent(text)}&c=MP3&f=44khz_16bit_stereo&r=0`;
    
    // Fetch the audio from the TTS service
    const response = await fetch(ttsUrl);
    
    if (!response.ok) {
      throw new Error(`TTS service error: ${response.status}`);
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    
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
