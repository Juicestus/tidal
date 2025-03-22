import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';

const CanvasDrawing = () => {
    const [tool, setTool] = React.useState('brush');
    const isDrawing = React.useRef(false);
    const imageRef = React.useRef<Konva.Image>(null);
    const lastPos = React.useRef<{ x: number; y: number } | null>(null);

    const { canvas, context } = React.useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 50;
        const context = canvas.getContext('2d');
        if (context) {
            context.strokeStyle = '#df4b26';
            context.lineJoin = 'round';
            context.lineWidth = 5;
        }
        return { canvas, context };
    }, []);

    const handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void = (e) => {
        isDrawing.current = true;
        lastPos.current = e.target.getStage()?.getPointerPosition() || null;
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!isDrawing.current) {
            return;
        }

        const image = imageRef.current;
        const stage = e.target.getStage();

        if (!context) return;

        context.globalCompositeOperation =
            tool === 'eraser' ? 'destination-out' : 'source-over';

        context.beginPath();
        const localPos = {
            x: lastPos.current && image ? lastPos.current.x - image.x() : 0,
            y: lastPos.current && image ? lastPos.current.y - image.y() : 0,
        };

        context.moveTo(localPos.x, localPos.y);

        const pos = stage?.getPointerPosition();
        if (!pos) return;
        const newLocalPos = {
            x: pos.x - (image ? image.x() : 0),
            y: pos.y - (image ? image.y() : 0),
        };

        context.lineTo(newLocalPos.x, newLocalPos.y);
        context.closePath();
        context.stroke();

        lastPos.current = pos;

        image?.getLayer()?.batchDraw();

    };

    const clearCanvas = () => {
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        imageRef?.current?.getLayer()?.batchDraw();
    };

    return (
        <div>
            <div className="tools">
                <select
                    value={tool}
                    onChange={(e) => setTool(e.target.value)}
                >
                    <option value="brush">Brush</option>
                    <option value="eraser">Eraser</option>
                </select>
                <button onClick={clearCanvas}>Clear Canvas</button>
            </div>

            <Stage
                width={window.innerWidth}
                height={window.innerHeight - 50}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                <Layer>
                    <Image
                        ref={imageRef}
                        image={canvas}
                        x={0}
                        y={0}
                    />
                    <Html>
                        <div style={{ 
                            padding: '10px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            position: 'absolute',
                            top: '20px',
                            left: '500px',
                        }}>
                            <h3>My HTML Element</h3>
                            <button onClick={() => console.log('Button clicked!')}>
                                Click Me
                            </button>
                        </div>
                    </Html>
                </Layer>
            </Stage>
        </div>
    );
};

export default CanvasDrawing;
