import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import { Button, ButtonGroup, Container } from 'react-bootstrap';
import { Html } from 'react-konva-utils';

const CanvasDrawing: React.FC<{ children?: React.ReactNode, queryCallback: any }> = ({ children, queryCallback }) => {
    const [tool, setTool] = React.useState<'brush' | 'eraser'>('brush');
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
        if (!isDrawing.current) return;

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

    const getLowestElementPos = (): { x: number; y: number } | null => {
        if (!context) return null;
    
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const { width, height, data } = imageData;
    
        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const alpha = data[index + 3]; // alpha channel
                if (alpha > 0) {
                    return { x, y };
                }
            }
        }
        return null; // Canvas empty
    };

    const queryAI = async () => {

        if (!context) return null;

        let lowestElementPos = getLowestElementPos();
        if (!lowestElementPos) {
            lowestElementPos = { x: 0, y: 0 };
        }

      

        await queryCallback(lowestElementPos.x, lowestElementPos.y + 20, canvas);
    }

    return (
        <Container fluid>
            <div className="d-flex gap-3 align-items-center mb-3 pt-3">
                <ButtonGroup>
                    <Button
                        variant={tool === 'brush' ? 'primary' : 'outline-secondary'}
                        onClick={() => setTool('brush')}
                    >
                        Brush
                    </Button>
                    <Button
                        variant={tool === 'eraser' ? 'primary' : 'outline-secondary'}
                        onClick={() => setTool('eraser')}
                    >
                        Eraser
                    </Button>
                </ButtonGroup>

                <Button
                    variant="danger"
                    className="ms-3"
                    onClick={clearCanvas}
                >
                    Clear Canvas
                </Button>

                <Button
                    variant="success"
                    className="ms-3"
                    onClick={queryAI}
                >
                    Ask GPT!
                </Button>
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
                    {children}
                </Layer>
            </Stage>
        </Container>
    );
};

export default CanvasDrawing;
