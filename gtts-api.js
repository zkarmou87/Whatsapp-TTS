// gTTS API Service for n8n WhatsApp Workflow
// Deploy this to Vercel for free TTS service

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

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
    const { text, voice = 'en', format = 'mp3', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Validate text length (gTTS has limits)
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    // Create temporary file paths
    const timestamp = Date.now();
    const inputFile = `/tmp/input_${timestamp}.txt`;
    const outputFile = `/tmp/output_${timestamp}.${format}`;

    // Write text to input file
    fs.writeFileSync(inputFile, text);

    // Install gTTS if not available
    try {
      await execAsync('pip install gTTS');
    } catch (error) {
      console.log('gTTS already installed or installation failed');
    }

    // Generate speech using gTTS
    const gttsCommand = `python -c "
import os
from gtts import gTTS
from gtts.lang import tts_langs

# Create gTTS object
tts = gTTS(text='${text.replace(/'/g, "\\'")}', lang='${voice}', slow=False)

# Save to file
tts.save('${outputFile}')
print('Audio generated successfully')
"`;

    await execAsync(gttsCommand);

    // Check if file was created
    if (!fs.existsSync(outputFile)) {
      throw new Error('Failed to generate audio file');
    }

    // Read the generated file
    const audioBuffer = fs.readFileSync(outputFile);
    
    // Clean up temporary files
    try {
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }

    // Return audio file
    res.setHeader('Content-Type', `audio/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename="voice_message.${format}"`);
    res.setHeader('Content-Length', audioBuffer.length);
    
    res.status(200).send(audioBuffer);

  } catch (error) {
    console.error('gTTS API Error:', error);
    
    // Clean up on error
    try {
      const timestamp = Date.now();
      const inputFile = `/tmp/input_${timestamp}.txt`;
      const outputFile = `/tmp/output_${timestamp}.mp3`;
      
      if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError.message);
    }

    res.status(500).json({ 
      error: 'Failed to generate audio',
      details: error.message 
    });
  }
}
