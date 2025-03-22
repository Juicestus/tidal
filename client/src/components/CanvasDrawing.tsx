import React from 'react'; 
import { Stage, Layer, Image, Rect } from 'react-konva';
import Konva from 'konva';
import { Button, ButtonGroup, Container } from 'react-bootstrap';
import { Html } from 'react-konva-utils';

const CanvasDrawing: React.FC<{ children?: React.ReactNode, queryCallback: any }> = ({ children, queryCallback }) => {
    const [tool, setTool] = React.useState<'brush' | 'eraser'>('brush');
    const [isLassoMode, setIsLassoMode] = React.useState(false);
    // selectionRect stores the rectangular lasso selection as { x, y, width, height }
    const [selectionRect, setSelectionRect] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
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

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        if (isLassoMode) {
            // Begin rectangular selection
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
            return;
        }

        isDrawing.current = true;
        lastPos.current = pos;
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (isLassoMode) {
            // Lasso (rectangle) completed – add your selection logic here.
            console.log("Rectangular lasso completed:", selectionRect);
            // Optionally, disable lasso mode automatically:
            setIsLassoMode(false);
            return;
        }
        isDrawing.current = false;
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        if (isLassoMode) {
            // If we have started a rectangle, update its width and height based on current pointer position.
            if (selectionRect) {
                const newWidth = pos.x - selectionRect.x;
                const newHeight = pos.y - selectionRect.y;
                setSelectionRect({ ...selectionRect, width: newWidth, height: newHeight });
            }
            return;
        }

        if (!isDrawing.current) return;

        const image = imageRef.current;
        if (!context) return;

        context.globalCompositeOperation =
            tool === 'eraser' ? 'destination-out' : 'source-over';

        context.beginPath();
        const localPos = {
            x: lastPos.current && image ? lastPos.current.x - image.x() : 0,
            y: lastPos.current && image ? lastPos.current.y - image.y() : 0,
        };

        context.moveTo(localPos.x, localPos.y);
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
                    variant={isLassoMode ? 'primary' : 'outline-secondary'}
                    className="ms-3"
                    onClick={() => {
                        if (selectionRect) {
                            setSelectionRect(null);
                            setIsLassoMode(false);
                            return;
                        }
                        setIsLassoMode(!isLassoMode);
                    }}
                >
                    {selectionRect ? 'Clear Lasso' : isLassoMode ? 'Cancel Lasso' : 'Lasso'}
                </Button>

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
                    {selectionRect && (
                        <Rect 
                            x={selectionRect.x}
                            y={selectionRect.y}
                            width={selectionRect.width}
                            height={selectionRect.height}
                            stroke="black"
                            dash={[4, 4]}
                        />
                    )}
                </Layer>
            </Stage>
        </Container>
    );
};

export default CanvasDrawing;
