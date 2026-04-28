import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { audioBase64, mimeType, lat, lng } = data;

    if (!audioBase64 || !mimeType) {
      return NextResponse.json({ success: false, error: 'Missing audio data' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            transcription: { type: SchemaType.STRING },
            count: { type: SchemaType.INTEGER },
            location: { type: SchemaType.STRING },
            hasElderly: { type: SchemaType.BOOLEAN },
            hasDisease: { type: SchemaType.BOOLEAN },
            diseaseType: { type: SchemaType.STRING, nullable: true }
          },
          required: ['transcription', 'count', 'location', 'hasElderly', 'hasDisease']
        }
      }
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType
        }
      },
      "Extract the following from the distress audio: exact transcription, number of people (count), where they are (location), if elderly are present (hasElderly), and if medical issues exist (hasDisease/diseaseType)."
    ]);

    const parsedData = JSON.parse(result.response.text());

    // In a real app, we would save this to Prisma here
    // For now we return the bundle
    return NextResponse.json({ 
      success: true, 
      data: {
        ...parsedData,
        gps: { lat, lng }
      }
    });
  } catch (error) {
    console.error('Gemini Voice SOS Error:', error);
    return NextResponse.json({ success: false, error: 'AI Extraction Failed' }, { status: 500 });
  }
}
