import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const strataProjectId = process.env.STRATA_PROJECT_ID;
    const strataApiKey = process.env.STRATA_API_KEY;

    if (!strataProjectId || !strataApiKey) {
      console.error('Missing Strata API credentials');
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    const strataEndpoint = process.env.STRATA_API_ENDPOINT || 'https://strata-zt3x.vercel.app/api/messages';

    const response = await fetch(strataEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-project-id': strataProjectId,
        'Authorization': `Bearer ${strataApiKey}`,
      },
      body: JSON.stringify({
        name,
        email,
        subject: subject || 'General Inquiry',
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Strata API error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
