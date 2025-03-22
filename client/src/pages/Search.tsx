import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MovableInputSidebar = () => {
    const [inputVisible, setInputVisible] = useState(false);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [inputValue, setInputValue] = useState("");
    const [items, setItems] = useState<string[]>([]);

    let isDragging = false;
    let offsetX: number = 0;
    let offsetY: number = 0;

    const showInput = () => {
        setInputVisible(true);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
        isDragging = true;
        offsetX = e.clientX - e.currentTarget.getBoundingClientRect().left;
        offsetY = e.clientY - e.currentTarget.getBoundingClientRect().top;
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY });
        }
    };

    const handleMouseUp = () => {
        isDragging = false;
    };

    useEffect(() => {
        if (inputVisible) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [inputVisible]);

    const handleAddItem = () => {
        if (inputValue.trim()) {
            setItems([...items, inputValue]);
            setInputValue("");
        }
    };

    return (
        <div className="flex">
            {/* Main Content */}
            <div className="flex-1 flex justify-center items-center min-h-screen">
                <div className="p-4 border rounded-lg shadow-lg bg-white relative">
                    <Button onClick={showInput}>Open Movable Input</Button>
                    {inputVisible && (
                        <input
                            type="text"
                            className="movable-input border p-2 rounded-md w-64 absolute"
                            placeholder="Type here..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            style={{
                                top: `${position.y}px`,
                                left: `${position.x}px`,
                                padding: '10px',
                                border: '1px solid #ccc',
                                fontSize: '16px',
                                width: '200px',
                            }}
                            onMouseDown={handleMouseDown}
                        />
                    )}
                    <Button onClick={handleAddItem} className="ml-2">Add</Button>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-64 bg-gray-200 p-4 h-screen overflow-y-auto">
                <h2 className="font-bold text-lg mb-2">Saved Items</h2>
                {items.length === 0 ? (
                    <p className="text-gray-500">No items yet.</p>
                ) : (
                    items.map((item, index) => (
                        <Card key={index} className="mb-2">
                            <CardContent className="p-2">{item}</CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default MovableInputSidebar;
