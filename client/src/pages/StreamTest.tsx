import { useContext, useEffect, useReducer, useState } from "react";

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

  const handleInput = () => {
    getNextResponse(userPrompt, 0, 0);
  }

  const [userPrompt, setUserPrompt] = useState("");

  return (
    <div className="main">
      <h1></h1>
      <input
        type="text"
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="Enter your query"
      />
      <button onClick={handleInput}>Submit</button>

      <div>
        <div className="">
                {loading ? <span>...</span> : response.text}
        </div>
      </div>

    </div>
  );
};
