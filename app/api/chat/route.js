import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { endpoint, apiKey, model, messages, stream = true } = body;

    if (!endpoint || !apiKey || !model || !messages) {
      return NextResponse.json(
        { error: 'Missing required parameters (endpoint, apiKey, model, messages)' },
        { status: 400 }
      );
    }

    // Clean up endpoint URL (ensure no trailing slash)
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const targetUrl = `${cleanEndpoint}/chat/completions`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gateway error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    // If streaming is enabled, pipe the stream back to the client
    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error('Proxy Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
