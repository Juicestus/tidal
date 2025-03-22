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

  const getNextResponse = async (x: number, y: number, canvas: HTMLCanvasElement) => {

    // const query = "I have uploaded an image of this students workspace. Please guide them through solving the question. Only ouput the imediate next step so they can try it themselves."
        // + "Do not mention anything about the image or analyzing the image, simply say that you are analyzing the workspace, and then provide the next step.";
        // const query = "Identify the equation that the student wrote in the attached image.";

    const query = "The following image is the workspace of a student attemtping to solve a homework problem"
    + "I would like you to help them out. Analyze the image to identify their work, but do not mention anything"
    + "about how you are a Large Language Model analyzing the image."
    + "To help them out, I want to see what they did and provide the next step for them to take. Only output the next step."
    + "They may have completed multiple steps already.";

    const base64Image = canvas.toDataURL('image/jpeg', 1.0);

    const res = await fetch('http://localhost:3001/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userMessage: query,
        imageBase64: base64Image,
       })
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
      
        try {
          const lines = buffer.split('\n').forEach(line => {
            const cleared = line.replace('data: ', '');
            if (cleared == "") return;
            const data = JSON.parse(cleared);
            const word = data['choices'][0]['delta']['content'];
            if (word === undefined) return;   // i dont fucking know
            setResponse(prev => ({
              ...prev,
              text: prev.text + word
            }));
          });
        } catch (e) {
          // console.log(e);
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
