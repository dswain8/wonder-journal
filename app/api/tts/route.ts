import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await request.json(); // Default to Rachel

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not set' }, { status: 500 });
    }

    // Create a hash of the text and voice to use as the filename
    const hash = crypto.createHash('sha256').update(`${voiceId}-${text}`).digest('hex');
    const fileName = `${hash}.mp3`;
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    const filePath = path.join(audioDir, fileName);

    // Ensure audio directory exists (for local development)
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Check cache
    if (fs.existsSync(filePath)) {
      console.log('Serving audio from cache');
      return NextResponse.json({ url: `/audio/${fileName}` });
    }

    console.log('Fetching new audio from ElevenLabs');
    // Fetch from ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Faster and cheaper model for english
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate audio' }, { status: response.status });
    }

    // Save audio file locally (NOTE: will need cloud blob storage for Vercel prod)
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Return the public URL
    return NextResponse.json({ url: `/audio/${fileName}` });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
