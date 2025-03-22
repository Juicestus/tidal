import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const CanvasElement = ({ xPos, yPos, content }: { xPos: number, yPos: number, content: string }) => {
    return (<Html>
        <div style={{
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #ddd',
            borderRadius: '4px',
            position: 'absolute',
            top: yPos + 'px',
            left: xPos + 'px',
            width: '600px',
        }}>
            {/* <p>{content}</p> */}
            {/* <p>
            {content.split(/(\$\$.*?\$\$|\$.*?\$)/g).map((part, i) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                return <BlockMath key={i}>{part.slice(2, -2)}</BlockMath>;
            } else if (part.startsWith('$') && part.endsWith('$')) {
                return <InlineMath key={i}>{part.slice(1, -1)}</InlineMath>;
            } else {
                return part;
            }
            })}
            </p> */}
            {/* <BlockMath math={content} /> */}

            {/* <p>{
                    renderMathInElement(content, {
                        delimiters: [
                          { left: "\\(", right: "\\)", display: false },
                          { left: "\\[", right: "\\]", display: true }
                        ],
                        throwOnError: false
                      })
                }</p> */}

            <p>
                {content.split(/(\\\(.+?\\\)|\\\[.+?\\\])/g).map((part, i) => {
                    // Inline math \( ... \)
                    if (part.startsWith('\\(') && part.endsWith('\\)')) {
                        const latex = part.slice(2, -2);
                        return <InlineMath key={i}>{latex}</InlineMath>;
                    }
                    // Block math \[ ... \]
                    if (part.startsWith('\\[') && part.endsWith('\\]')) {
                        const latex = part.slice(2, -2);
                        return <InlineMath key={i}>{latex}</InlineMath>; // ⬅ separate from <p>
                    }
                    // Normal text block
                    return <span key={i}>{part}</span>;
                })}
            </p>
        </div>
    </Html>);
};

export default CanvasElement;
