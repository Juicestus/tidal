import { useEffect, useReducer, useState } from "react";
import DrawingCanvas from "../components/CanvasDrawing";
import CanvasElement from "../components/CanvasElement";
import { Canvas } from "konva/lib/Canvas";
import Loading from "../components/Loading";
import CanvasLoading from "../components/Loading";

function cloneCanvas(oldCanvas: HTMLCanvasElement): HTMLCanvasElement {
  // Create a new canvas element with the same dimensions
  const newCanvas = document.createElement('canvas');
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;

  // Get the 2D rendering context for both canvases
  const newCtx = newCanvas.getContext('2d');
  const oldCtx = oldCanvas.getContext('2d');

  if (!newCtx || !oldCtx) {
    throw new Error('Could not get 2D context');
  }

  // Draw the old canvas onto the new canvas
  newCtx.drawImage(oldCanvas, 0, 0);

  // Get image data from the new canvas
  const imageData = newCtx.getImageData(0, 0, newCanvas.width, newCanvas.height);
  const data = imageData.data;

  // Invert each pixel
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];     // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
    // Alpha stays the same: data[i + 3]
  }

  // Put the inverted image data back on the canvas
  newCtx.putImageData(imageData, 0, 0);

  return newCanvas;
}


function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

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

  const [responses, setResponses] = useState<AIResponse[]>([]);
  useEffect(() => {
    if (response.text !== "") {
      setResponses(prev => {
      const newResponses = [...prev];
      if (newResponses.length > 0) {
        newResponses[newResponses.length - 1] = response;
      } else {
        newResponses.push(response);
      }
      return newResponses;
      });
    } else {
      setResponses(prev => [...prev, response]);
    }
  }, [response]);

  const [loading, setLoading] = useState(false);

  const getNextResponse = async (x: number, y: number, realCanvas: HTMLCanvasElement) => {

    const query = "The following image is the workspace of a student attempting to solve a homework problem."
    + "Analyze the image to identify the problem and their work."
    + "Please guide them through the *next step* they need to take."
    + "Do not just give them the answer, or give them more than just the next step."
    + "Explain it like they are a grade school student."
    + "They may have completed steps already that you have guided them through. Continue by giving them the next step."
    + "Multiple figures in the problem likely correspond to sequential steps in their work."
    + "If it appears they have written a final answer, provide feedback on their answer."
    + "If they have made a mistake at any step, provide feedback on their mistake and guide them through the next correct step."
    + "Do not halucinate any information, only provide feedback on what they have written."
    + "Do not mention anything about how you are a Large Language Model analyzing the image."
    + "Dont do any computation for the student. Only output *next step* that the student should perform. Be fairly brief and to the point."
    ;

    const canvas = cloneCanvas(realCanvas);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      for (const response of responses) {
        console.log(response);
        if (response.text === "") continue;
        ctx.font = '14px Arial';
        ctx.fillStyle = 'red';
        // ctx.fillText(response.text, response.pos.x, response.pos.y + 30);
        wrapText(ctx, response.text, response.pos.x, response.pos.y + 30, 800, 24);
      }
    }

    const base64Image = canvas.toDataURL('image/jpeg', 1.0);

    console.log(base64Image);

    setResponse({ text: "", pos: { x, y } });
    setLoading(true);

    const res = await fetch('http://localhost:3001/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userMessage: query,
        imageBase64: base64Image,
       })
    });


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
            setLoading(false);
            setResponse(prev => ({
              ...prev,
              text: prev.text + word,
              pos: { x, y }
            }));
          });
        } catch (e) {
          // console.log(e);
        }
      }
      console.log("Done!");
    }
  }

 const genResponse = (response: AIResponse, i: number) => {
        if (loading && i == responses.length - 1) 
            return <CanvasLoading xPos={response.pos.x} yPos={response.pos.y}/>;
        if (response.text === "") return (<></>);
        return <CanvasElement key={i} xPos={response.pos.x} yPos={response.pos.y} content={response.text}/>
 }

  return (
    <div className="main">
        <DrawingCanvas queryCallback={getNextResponse}>
          {responses.map(genResponse)}
        </DrawingCanvas>
    </div>
  );
};
