import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const CanvasElement = ({ xPos, yPos, content }: { xPos: number, yPos: number, content: string }) => {
    return (<Html>
        <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 1.0)',
            border: '1px solid #ddd',
            borderRadius: '1rem',
            position: 'absolute',
            top: yPos + 'px',
            left: xPos + 'px',
            width: '800px',
        }}>
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
