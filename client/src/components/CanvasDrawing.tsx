import React from 'react';
import { Stage, Layer, Image, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { Container } from 'react-bootstrap';
import Toolbar from './Toolbar';

interface Stroke {
    tool: 'brush' | 'eraser' | 'undo';
    points: Array<{ x: number; y: number }>;
    lineWidth: number;
    strokeStyle: string;
}

const CanvasDrawing: React.FC<{ children?: React.ReactNode; queryCallback: any; clearCallback: any }> = ({ children, queryCallback, clearCallback }) => {
    const [tool, setTool] = React.useState<'brush' | 'eraser' | 'lasso'>('brush');
    const [strokes, setStrokes] = React.useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = React.useState<Stroke | null>(null);
    const [selectionRect, setSelectionRect] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);
    const isDrawing = React.useRef(false);
    const imageRef = React.useRef<Konva.Image>(null);
    const lastPos = React.useRef<{ x: number; y: number } | null>(null);
    const [strokeWidth, setStrokeWidth] = React.useState<number>(5);

    // Replace dynamic dimensions with fixed large ones for an "infinite" scroll effect
    const stageWidth = document.documentElement.clientWidth;
    const stageHeight = 4096;

    const { canvas, context } = React.useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = stageWidth;
        canvas.height = stageHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.strokeStyle = '#000000';
            context.lineJoin = 'round';
            context.lineWidth = 5;
        }
        return { canvas, context };
    }, []);

    React.useEffect(() => {
        if (context) {
            context.lineWidth = (tool === "brush" ? 1 : 5) * strokeWidth;
        }
    }, [context, strokeWidth, tool]);

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        if (tool === 'lasso') {
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
            return;
        }

        isDrawing.current = true;
        lastPos.current = pos;

        setCurrentStroke({
            tool,
            points: [{ x: pos.x, y: pos.y }],
            lineWidth: (tool === "brush" ? 1 : 5) * strokeWidth,
            strokeStyle: context?.strokeStyle?.toString() || '#000000',
        });
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        // Always track cursor position for overlay
        setCursorPos(pos);

        if (tool === 'lasso') {
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
                points: [...currentStroke.points, { x: pos.x, y: pos.y }],
            });
        }

        const image = imageRef.current;
        if (!context) return;

        context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
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

    const handleMouseUp = () => {
        if (tool === 'lasso') {
            return;
        }
        isDrawing.current = false;

        if (currentStroke && currentStroke.points.length > 1) {
            setStrokes([...strokes, currentStroke]);
            setCurrentStroke(null);
        }
        setCursorPos(null); // Hide eraser circle after mouseup
    };

    const undoStroke = () => {
        if (strokes.length === 0) return;

        const newStrokes = strokes.slice(0, strokes.length - 1);
        setStrokes(newStrokes);

        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        newStrokes.forEach((stroke) => {
            context.lineWidth = stroke.lineWidth;
            context.strokeStyle = stroke.strokeStyle;
            context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

            context.beginPath();
            context.moveTo(stroke.points[0].x, stroke.points[0].y);
            stroke.points.forEach((point) => {
                context.lineTo(point.x, point.y);
            });
            context.stroke();
        });

        imageRef.current?.getLayer()?.batchDraw();
    };

    const clearCanvas = () => {
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        setStrokes([]);
        clearCallback();
        imageRef?.current?.getLayer()?.batchDraw();
    };

    const getLowestElementPos = (): { x: number; y: number } | null => {
        if (!context) return null;

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const { width, height, data } = imageData;

        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const alpha = data[index + 3];
                if (alpha > 0) {
                    return { x, y };
                }
            }
        }
        return null;
    };

    const queryAI = async () => {
        if (!context) return null;
        let lowestElementPos = getLowestElementPos();
        if (!lowestElementPos) {
            lowestElementPos = { x: 0, y: 0 };
        }
        console.log("Querying AI at position:", lowestElementPos);
        await queryCallback(20, lowestElementPos.y + 30, canvas);
    };

    return (
        <>
            <Toolbar
                tool={tool}
                setTool={setTool}
                setStrokeWidth={setStrokeWidth}
                undoStroke={undoStroke}
                clearCanvas={clearCanvas}
                queryAI={queryAI}
            />
        <Container fluid style={{ padding: 0 }}>
        

            <Stage
                width={stageWidth}
                height={stageHeight}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                <Layer>
                    <Image ref={imageRef} image={canvas} x={0} y={0} />
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
                    {tool === 'eraser' && cursorPos && (
                        <Circle
                            x={cursorPos.x}
                            y={cursorPos.y}
                            radius={(strokeWidth * 5) / 2}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={1}
                            dash={[4, 4]}
                            listening={false}
                        />
                    )}
                </Layer>
            </Stage>
        </Container>
    </>);
};

export default CanvasDrawing;
