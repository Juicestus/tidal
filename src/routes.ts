import { Request, Response } from 'express';
import fetch from 'node-fetch';

import dotenv from 'dotenv';
dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const asstID = "asst_JqVhedKxpUUIXHBbGSKb1NTT";

const headers = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    };

export const query = async (req: Request, res: Response) => {
  const { userMessage } = req.body;

  const threadRes = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: headers
    // body: JSON.stringify({})
  });
  if (!threadRes.ok) {
    const error = await threadRes.json();
    console.error('❌ Message send failed:', error);
    return;
  }

  const threadID = ((await threadRes.json()) as any).id;  // unsafe


  const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadID}/messages`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      role: 'user',
      content: userMessage
    })
  });
  if (!msgRes.ok) {
    const error = await msgRes.json();
    console.error('❌ Message send failed:', error);
    return;
  }

  const streamRes = await fetch(`https://api.openai.com/v1/threads/${threadID}/runs`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      assistant_id: asstID,
      stream: true
    })
  });

  // if (!runRes.ok) {
  //   const error = await runRes.json();
  //   console.error('❌ Run creation failed:', error);
  //   return;
  // }

  // const runID = ((await runRes.json()) as any).id;

  // const streamRes = await fetch(`https://api.openai.com/v1/threads/${threadID}/runs/${runID}/stream`, {
  //   headers: headers
  // });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  streamRes.body!.on('data', (chunk) => {
    res.write(chunk);
  });

  streamRes.body!.on('end', () => {
    console.log('Stream ended');
    res.end();
  });
};
