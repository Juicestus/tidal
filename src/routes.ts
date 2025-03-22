import { Request, Response } from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

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
  const { userMessage, imageBase64 } = req.body;

  // fs.writeFileSync('image.jpg', imageBase64, 'base64');
  // console.log(imageBase64)

  const systemPrompt = "You are a helpful assistant that can process images and answer questions.";

  const messages: any[] = [
    { role: "system", content: systemPrompt }
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userMessage },
        {
          type: "image_url",
          image_url: {
            url: imageBase64 // ⚠️ must be a data URL like 'data:image/jpeg;base64,...'
          }
        },
      ]
    });
  } else {
    messages.push({ role: "user", content: userMessage });
  }

  console.log(JSON.stringify(messages));

  const streamRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-2024-04-09', // must use vision-capable model
      messages,
      stream: true,
      max_tokens:4096 
    })
  });

  console.log('✅ Stream started');
  if (!streamRes.ok) {
    console.log(await streamRes.json());
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  streamRes.body!.on('data', (chunk) => {
    console.log(chunk.toString());
    res.write(chunk);
  });

  streamRes.body!.on('end', () => {
    console.log('✅ Stream ended');
    res.end();
  });
};
