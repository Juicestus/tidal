import React from 'react';

const InputText = () => {
    const [inputVisible, setInputVisible] = useState(false);

    // This will hold the position of the input
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

    React.useEffect(() => {
        if (inputVisible) {
            // Add event listeners when the input is visible
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Clean up event listeners when the component is unmounted
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [inputVisible]);

    return (
        <div>
            <button className="show-input-btn" onClick={showInput}>
                Open Movable Input
            </button>

            {inputVisible && (
                <input
                    type="text"
                    className="movable-input"
                    placeholder="Type here..."
                    style={{
                        position: 'absolute',
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
        </div>
    );
};

export default InputText;
