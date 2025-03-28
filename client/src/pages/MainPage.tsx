import { useEffect, useReducer, useState } from "react";
import DrawingCanvas from "../components/CanvasDrawing";
import CanvasElement from "../components/CanvasElement";
import Loading from "../components/Loading";
import CanvasLoading from "../components/Loading";
import "../Popup.css"; // Make sure this file is available and contains styles for .popup-overlay & .popup-content

const PROD_SERVER_ADRESS = "https://tidal-y36e.onrender.com";
const TEST_SERVER_ADRESS = "http://localhost:3001";

const serverAdresses = {
  'production': PROD_SERVER_ADRESS,
  'development': TEST_SERVER_ADRESS,
  'test': TEST_SERVER_ADRESS
};

// const nodeEnv = process.env.NODE_ENV;
const nodeEnv = 'production';
const api = (x: String): string => serverAdresses[nodeEnv] + "/" + x;

function cloneCanvas(oldCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const newCanvas = document.createElement("canvas");
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;

  const newCtx = newCanvas.getContext("2d");
  const oldCtx = oldCanvas.getContext("2d");

  if (!newCtx || !oldCtx) {
    throw new Error("Could not get 2D context");
  }

  newCtx.drawImage(oldCanvas, 0, 0);

  const imageData = newCtx.getImageData(0, 0, newCanvas.width, newCanvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
  }
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
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}


function cropCanvasToContentWithPadding(canvas: HTMLCanvasElement, padding = 20, threshold = 240) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;


  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      // White content on black background detection
      if (a > 0 && r > threshold && g > threshold && b > threshold) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) {
    console.warn('No content found to crop.');
    return canvas;
  }

  minX = Math.max(minX - padding, 0);
  minY = Math.max(minY - padding, 0);
  maxX = Math.min(maxX + padding, width);
  maxY = Math.min(maxY + padding, height);

  const croppedWidth = maxX - minX;
  const croppedHeight = maxY - minY;


  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;
  const croppedCtx = croppedCanvas.getContext('2d');

  if (croppedCtx) {
    croppedCtx.drawImage(
      canvas,
      minX, minY, croppedWidth, croppedHeight,
      0, 0, croppedWidth, croppedHeight
    );
  }

  return croppedCanvas;
}

interface Point {
  x: number;
  y: number;
}

interface AIResponse {
  text: string;
  pos: Point;
}

export default () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [response, setResponse] = useState<AIResponse>({
    text: "",
    pos: { x: 0, y: 0 },
  });

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
      setResponses((prev) => [...prev, response]);
    }
  }, [response]);

  const [loading, setLoading] = useState(false);

  const getNextResponse = async (x: number, y: number, realCanvas: HTMLCanvasElement) => {

    // let query = "You are an educational assistant helping students with homework problems.\n"
    //   + "The following image is the workspace of a student attempting to solve a homework problem.\n"
    //   + "Analyze the image to identify the problem and their work.\n"
    //   + "Please guide them through the *next step* they need to take.\n"
    //   + "Do not just give them the answer, or give them more than just the next step.\n"
    //   + "When guiding to the next step, provide a clear, actionable instruction that builds directly on their current progress without solving the entire problem for them."
    //   + "Explain it like they are a grade school student.\n"
    //   + "If the student's work is unclear, illegible, or incomplete, first acknowledge what you can understand and ask a clarifying question to help them proceed."
    //   + "Adjust the complexity of your explanation based on the difficulty of the content.\n"
    //   + "They may have completed steps already that you have guided them through. Continue by giving them the next step.\n"
    //   + "Multiple figures in the problem likely correspond to sequential steps in their work.\n"
    //   + "If they box a step, assume it is their final answer.\n"
    //   + "Do not require them to fully simplify the problem or check their work, you should tell them if it is correct.\n"
    //   + "If they have completed the problem, evaluate their work and ask them if they want to try something else.\n"
    //   + "If they have made a mistake at any step, provide feedback on their mistake and guide them through the next correct step.\n"
    //   + "Do not halucinate any information, only provide feedback on what they have written.\n"
    //   + "Do not mention anything about how you are a Large Language Model analyzing the image.\n"
    //   + "Dont do any computation for the student. Only output *next step* that the student should perform. Be fairly brief and to the point.\n"
    //   + "Only output valid text and valid inline latex expressions. Do not output code or markdown."
    //   ;

    let query = `You are an educational assistant helping students with homework problems through a step-by-step guidance system.

With each interaction, you will:
1) Receive an updated image of the student's current work
2) Have access to your previous instructions to the student
3) Provide ONLY the next logical step they should take

Your guidance must:
- Identify exactly where the student is in their problem-solving process
- Provide just ONE clear, actionable instruction for their next step
- Build directly on their visible progress without solving ahead
- Use grade-school appropriate language matching the content difficulty
- Acknowledge any progress made since your last instruction

If the student's work is unclear:
- Note what you can understand from their work
- Ask a specific clarifying question

For student mistakes:
- Gently point out the error
- Guide them to the correct next step

For completed problems:
- Evaluate their final answer (if they've boxed it or clearly indicated completion)
- Ask if they want to try something else

Important constraints:
- Never solve the entire problem for them
- Don't require unnecessary simplification or work-checking
- Keep responses concise and focused on the immediate next step
- Only reference what is visible in their current work
- Use only valid text and inline latex expressions when needed
- Never mention that you are analyzing images or that you're an AI

Remember: Each of your responses should provide just enough guidance for ONE step forward in their learning process.`;


    let canvas = cloneCanvas(realCanvas);

    let goodResponses = responses.filter(response => response.text !== "");

    if (goodResponses.length > 0) {
      query += "The student has already completed the following steps that you have given them:\n";
      for (const response of goodResponses) {
        query += "- " + response.text + "\n";
      }
    } else {
      query += "The student has not completed any steps yet.\n";
    }

    // const ctx = canvas.getContext('2d');
    // if (ctx) {
    //   for (const response of responses) {
    //     console.log(response);
    //     if (response.text === "") continue;
    //     ctx.font = '14px Arial';
    //     ctx.fillStyle = 'white';
    //     // ctx.fillText(response.text, response.pos.x, response.pos.y + 30);
    //     wrapText(ctx, response.text, response.pos.x, response.pos.y + 30, 800, 24);
    //   }
    // }

    let croppedCanvas = cropCanvasToContentWithPadding(canvas, 20);
    if (croppedCanvas === null) {
      console.log('Could not crop canvas');
      croppedCanvas = canvas;
    }

    const base64Image = croppedCanvas.toDataURL('image/jpeg', 1.0);

    console.log(base64Image);

    setResponse({ text: "", pos: { x, y } });
    setLoading(true);

    const res = await fetch(api('query'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: query,
        imageBase64: base64Image,
      })
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer = decoder.decode(value, { stream: true });

        try {
          buffer.split("\n").forEach((line) => {
            const cleared = line.replace("data: ", "");
            if (cleared === "") return;
            const data = JSON.parse(cleared);
            const word = data["choices"][0]["delta"]["content"];
            if (word === undefined) return;
            setLoading(false);
            setResponse((prev) => ({
              ...prev,
              text: prev.text + word,
              pos: { x, y },
            }));
          });
        } catch (e) {
          // Ignore errors from incomplete JSON data
        }
      }
      console.log("Done!");
    }
  }

  const genResponse = (response: AIResponse, i: number) => {
    if (loading && i == responses.length - 1)
      return <CanvasLoading xPos={response.pos.x} yPos={response.pos.y} />;
    if (response.text === "") return (<></>);
    return <CanvasElement key={i} xPos={response.pos.x} yPos={response.pos.y} content={response.text} />
  }

  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div
      className="main"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "auto",
      }}
    >
      {/* Instructions Popup (shown immediately on launch) */}
      {showInstructions && (
        <div
          className="popup-overlay"
          onClick={(e) => {
            // Prevent closing the popup by clicking outside the content
            e.stopPropagation();
          }}
        >
          <div className="popup-content">
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                color: "black",
              }}
              onClick={() => setShowInstructions(false)}
            >
              <b className="x-button">X</b>
            </button>
            <h2>Welcome to Skutor</h2>
            <p>
              To get started with your personalized sketch tutor, <br></br>
              draw a question on the canvas. The app will provide <br></br> you with specific step-by-step feedback.
            </p>
            <p>
              Enjoy your Skutor!
            </p>
          </div>
        </div>
      )}


      {/* The scrollable container wrapping the large canvas */}
      <DrawingCanvas
        queryCallback={getNextResponse}
        clearCallback={() => setResponses([])}
      >
        {responses.map(genResponse)}
      </DrawingCanvas>
    </div>
  );
};
