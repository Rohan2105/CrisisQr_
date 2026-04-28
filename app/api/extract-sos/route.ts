import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            peopleCount: { type: SchemaType.NUMBER },
            medicalIssues: { 
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            emergencyType: { type: SchemaType.STRING },
            urgencyScore: { type: SchemaType.NUMBER }
          },
          required: ['peopleCount', 'medicalIssues', 'emergencyType', 'urgencyScore']
        }
      }
    });

    const prompt = `Extract emergency details from this distress message (it may be in English, Hindi, or Hinglish): "${text}". 
    Identify the number of people, specific medical issues mentioned, the type of emergency, and assign an urgency score from 1-100.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const extractedData = JSON.parse(response.text());

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Extraction Error:', error);
    return NextResponse.json({ success: false, error: 'Extraction failed' }, { status: 500 });
  }
}
