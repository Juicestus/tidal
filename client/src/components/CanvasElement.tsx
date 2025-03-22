import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';

const CanvasElement = ({xPos, yPos, content}: {xPos: number, yPos: number, content: string}) => {
    return (<Html>
        <div style={{
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #ddd',
            borderRadius: '4px',
            position: 'absolute',
            top: yPos + 'px',
            left: xPos + 'px',
            width: 'auto',
        }}>
            <p>{content}</p>
        </div>
    </Html>);
};

export default CanvasElement;
