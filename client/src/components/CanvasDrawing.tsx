import React from 'react';
import { Stage, Layer, Image, Rect } from 'react-konva';
import Konva from 'konva';
import { Button, ButtonGroup, Container, Dropdown } from 'react-bootstrap';
import { Html } from 'react-konva-utils';

interface Stroke {
    tool: 'brush' | 'eraser' | 'undo';
    points: Array<{ x: number, y: number }>;
    lineWidth: number;
    strokeStyle: string;
}

const CanvasDrawing: React.FC<{ children?: React.ReactNode, queryCallback: any }> = ({ children, queryCallback }) => {
    const [tool, setTool] = React.useState<'brush' | 'eraser' | 'lasso'>('brush');
    const [isLassoMode, setIsLassoMode] = React.useState(false);
    // Add states for stroke history and current stroke
    const [strokes, setStrokes] = React.useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = React.useState<Stroke | null>(null);
    const [selectionRect, setSelectionRect] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const isDrawing = React.useRef(false);
    const imageRef = React.useRef<Konva.Image>(null);
    const lastPos = React.useRef<{ x: number; y: number } | null>(null);

    const [strokeWidth, setStrokeWidth] = React.useState<number>(5);

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


    React.useEffect(() => {
        if (context) {
            context.lineWidth = (tool === "brush" ? 1 : 3) * strokeWidth;
        }
    }
        , [context, strokeWidth, tool]);

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        if (tool == 'lasso') {
            // Begin rectangular selection
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
            return;
        }

        isDrawing.current = true;
        lastPos.current = pos;

        setCurrentStroke({
            tool,
            points: [{ x: pos.x, y: pos.y }],
            lineWidth: (tool === "brush" ? 1 : 3) * strokeWidth,
            strokeStyle: context?.strokeStyle?.toString() || '#df4b26'
        });
    };

    const undoStroke = () => {
        if (strokes.length === 0) return;

        const newStrokes = strokes.slice(0, strokes.length - 1);
        setStrokes(newStrokes);

        if (!context) return;

        context?.clearRect(0, 0, canvas.width, canvas.height);
        newStrokes.forEach(stroke => {

            context.lineWidth = stroke.lineWidth;
            context.strokeStyle = stroke.strokeStyle;
            context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

            context?.beginPath();
            context?.moveTo(stroke.points[0].x, stroke.points[0].y);
            stroke.points.forEach(point => {
                context?.lineTo(point.x, point.y);
            });
            context?.stroke();
        })

        imageRef.current?.getLayer()?.batchDraw();


    }

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (tool == 'lasso') {

            return;
        }
        isDrawing.current = false;

        if (currentStroke && currentStroke.points.length > 1) {
            setStrokes([...strokes, currentStroke]);
            setCurrentStroke(null);
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        if (tool == 'lasso') {
            // If we have started a rectangle, update its width and height based on current pointer position.
            if (selectionRect) {
                const newWidth = pos.x - selectionRect.x;
                const newHeight = pos.y - selectionRect.y;
                setSelectionRect({ ...selectionRect, width: newWidth, height: newHeight });
            }
            return;
        }

        if (!isDrawing.current) return;

        if (currentStroke) {
            setCurrentStroke({
                ...currentStroke,
                points: [...currentStroke.points, { x: pos.x, y: pos.y }]
            });
        }

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
        setStrokes([]);
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

        console.log("Querying AI at position:", lowestElementPos);

        await queryCallback(0, lowestElementPos.y + 30, canvas);
    }


    return (
        <Container fluid>
            <div className="d-flex gap-3 align-items-center mb-3 pt-3">
                <ButtonGroup>
                    <Button
                        variant={tool === 'brush' ? 'primary' : 'outline-secondary'}
                        onClick={() => setTool('brush')}
                    >
                        <img
                            src="/pencil.svg"
                            alt="Brush"
                            style={{
                                width: '24px',
                                height: '24px',
                                filter: tool === 'brush' ? 'brightness(0) invert(1)' : 'none'
                            }}
                        />
                    </Button>
                    <Button
                        variant={tool === 'eraser' ? 'primary' : 'outline-secondary'}
                        onClick={() => setTool('eraser')}
                    >
                        <img
                            src="/eraser.svg"
                            alt="Eraser"
                            style={{
                                width: '24px',
                                height: '24px',
                                filter: tool === 'eraser' ? 'brightness(0) invert(1)' : 'none'
                            }}
                        />
                    </Button>
                    {/* <Button
                        variant={tool === 'lasso' ? 'primary' : 'outline-secondary'}
                        onClick={() => {
                            if (selectionRect) {
                                setSelectionRect(null);
                                setTool('brush'); // Reset to brush after clearing selection
                                return;
                            }
                            setTool('lasso');
                        }}
                    >
                        {selectionRect ? 'Clear Lasso' : <img
                            src="/select.svg"
                            alt="select"
                            style={{
                                width: '24px',
                                height: '24px',
                                filter: tool === 'lasso' ? 'brightness(0) invert(1)' : 'none'
                            }}
                        />}
                    </Button> */}
                </ButtonGroup>

                <Dropdown style={{ width: 'auto' }}>
                    <Dropdown.Toggle
                        variant="outline-secondary"
                        id="stroke-width-dropdown"
                        style={{ minWidth: '40px' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
                            <g className="layer">
                                <title>Layer 1</title>
                                <path d="m13.23,19.6c0,-1.21 0.98,-2.19 2.19,-2.19l70.63,0c1.21,0 2.18,0.98 2.18,2.19l0,3.44c0,1.21 -0.97,2.19 -2.18,2.19l-70.63,0c-1.21,0 -2.19,-0.98 -2.19,-2.19l0,-3.44z" fill-rule="evenodd" id="svg_1" />
                                <path d="m13.23,39.49c0,-1.21 0.98,-2.19 2.19,-2.19l70.63,0c1.21,0 2.18,0.98 2.18,2.19l0,8.13c0,1.21 -0.97,2.18 -2.18,2.18l-70.63,0c-1.21,0 -2.19,-0.97 -2.19,-2.18l0,-8.13z" fill-rule="evenodd" id="svg_2" />
                                <path d="m13.23,64.08c0,-1.21 0.98,-2.19 2.19,-2.19l70.63,0c1.21,0 2.18,0.98 2.18,2.19l0,17.5c0,1.21 -0.97,2.19 -2.18,2.19l-70.63,0c-1.21,0 -2.19,-0.98 -2.19,-2.19l0,-17.5z" fill-rule="evenodd" id="svg_3" />
                            </g>
                        </svg>
                    </Dropdown.Toggle>

                    <Dropdown.Menu style={{ minWidth: '120px' }}>
                        <Dropdown.Item onClick={() => setStrokeWidth(2)}>
                            <div className="d-flex align-items-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="me-2">
                                    <circle cx="12" cy="12" r="1" fill="#000" />
                                </svg>
                                Thin
                            </div>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setStrokeWidth(5)}>
                            <div className="d-flex align-items-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="me-2">
                                    <circle cx="12" cy="12" r="2.5" fill="#000" />
                                </svg>
                                Medium
                            </div>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setStrokeWidth(10)}>
                            <div className="d-flex align-items-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="me-2">
                                    <circle cx="12" cy="12" r="5" fill="#000" />
                                </svg>
                                Thick
                            </div>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <Button
                    onClick={undoStroke}
                >
                    <img
                        src="/arrow-rotate-left.svg"
                        alt="Eraser"
                        style={{
                            width: '24px',
                            height: '24px',
                            filter: 'brightness(0) invert(1)'
                        }}
                    />
                </Button>


                <Button
                    variant="danger"
                    className="ms-3"
                    onClick={clearCanvas}
                >
                    <img
                        src="/trash-can.svg"
                        alt="Eraser"
                        style={{
                            width: '24px',
                            height: '24px',
                            filter: 'brightness(0) invert(1)'
                        }}
                    />
                </Button>

                <Button
                    variant="success"
                    className="ms-3"
                    onClick={queryAI}
                >
                    <img
                        src="/lb.svg"
                        alt="Eraser"
                        style={{
                            width: '30px',
                            height: '30px',
                            filter: 'brightness(0) invert(1)'
                        }}
                    />
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
