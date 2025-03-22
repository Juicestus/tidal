import { useEffect, useReducer, useState } from "react";
import DrawingCanvas from "../components/CanvasDrawing";
import CanvasElement from "../components/CanvasElement";

interface Point {
  x: number;
  y: number;
};

interface AIResponse {
  text: string;
  pos: Point;
}

export default () => {

  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // const [responses, setResponses] = useState<AIResponse[]>([]);
  const [response, setResponse] = useState<AIResponse>({ text: "", pos: { x: 0, y: 0 } });
  const [loading, setLoading] = useState(false);

  const getNextResponse = async (query: string, x: number, y: number) => {
    console.log(query);

    const delay = () => new Promise((resolve) => setTimeout(resolve, 0));

    const res = await fetch('http://localhost:3001/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: query })
    });

    setLoading(true);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer = decoder.decode(value, { stream: true });
        //console.log(buffer);
        const lines = buffer.split('\n');
        const event = lines[0].replace('event: ', '');
        if (event === 'thread.message.delta') {
          const data = JSON.parse(lines[1].replace('data: ', ''));
            //responses => response.text += data['delta']['content'][0]['text']['value']);
          setLoading(false);
          setResponse(prev => ({
            ...prev,
            text: prev.text + data['delta']['content'][0]['text']['value']
          }));
        }
      }
      console.log("Done!");
    }
  }

  return (
    <div className="main">
        <DrawingCanvas queryCallback={getNextResponse}>
          <CanvasElement xPos={0} yPos={0} content={response.text}/>
        </DrawingCanvas>
    </div>
  );
};
