import React from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import { Html } from 'react-konva-utils';

const iconStyle = { width: '20px', height: '20px', display: 'block', margin: '0 auto' };
const fillButtonIconStyle = (scale: number, maxWidth: number = 20) =>
    ({ width: '100%', height: '100%', maxWidth: '' + maxWidth + 'px', maxHeight: '20px', display: 'block', margin: '0 auto', transform: 'scale(' + scale + ')' });

const Toolbar = ({ tool, setTool, strokeWidth, setStrokeWidth, undoStroke, clearCanvas, queryAI }: any) => {
    return (<>

        <div
            style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 1.0)',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Changed from 'flex-start' to position logo on right
                gap: '8px',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 500,
            }}
        >
            {/* Left side controls group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ButtonGroup size="lg">
                    <Button
                        variant={tool === 'brush' ? 'dark' : 'outline-secondary'}
                        onClick={() => setTool('brush')}
                    >
                        <img src="/pencil.svg" alt="Brush" style={{
                            ...fillButtonIconStyle(0.8),
                            filter: tool === 'brush' ? 'brightness(0) invert(1)' : 'none'
                        }} />
                    </Button>
                    <Button
                        variant={tool === 'eraser' ? 'dark' : 'outline-secondary'}
                        onClick={() => setTool('eraser')}
                    >
                        <img src="/eraser.svg" alt="Eraser" style={{
                            ...fillButtonIconStyle(0.8),
                            filter: tool === 'eraser' ? 'brightness(0) invert(1)' : 'none'
                        }} />
                    </Button>
                </ButtonGroup>

                <Dropdown>
                    <Dropdown.Toggle
                        variant="outline-secondary"
                        size="lg"
                        style={{
                            padding: '0 12px',
                            height: '38px', // aligns better with lg buttons (approx 38-40px)
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path d="m13.23,19.6c0,-1.21 0.98,-2.19 2.19,-2.19l70.63,0c1.21,0 2.18,0.98 2.18,2.19l0,3.44c0,1.21 -0.97,2.19 -2.18,2.19l-70.63,0c-1.21,0 -2.19,-0.98 -2.19,-2.19l0,-3.44z" />
                                <path d="m13.23,39.49c0,-1.21 0.98,-2.19 2.19,-2.19l70.63,0c1.21,0 2.18,0.98 2.18,2.19l0,8.13c0,1.21 -0.97,2.18 -2.18,2.18l-70.63,0c-1.21,0 -2.19,-0.97 -2.19,-2.18l0,-8.13z" />
                                <path d="m13.23,64.08c0,-1.21 0.98,-2.19 2.19,-2.19l70.63,0c1.21,0 2.18,0.98 2.18,2.19l0,17.5c0,1.21 -0.97,2.19 -2.18,2.19l-70.63,0c-1.21,0 -2.19,-0.98 -2.19,-2.19l0,-17.5z" />
                            </g>
                        </svg>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {[2, 5, 10].map((size) => (
                            <Dropdown.Item
                                key={size}
                                onClick={() => setStrokeWidth(size)}
                                className="stroke-width-item"
                                style={{
                                    backgroundColor: 'white',
                                    color: '#212529',
                                }}
                                active={false}
                                as="button" // Ensures it's a button element for proper hover handling
                            >
                                <div
                                    className="d-flex align-items-center"
                                    style={{
                                        transition: 'all 0.2s',
                                        borderRadius: '4px', // Add rounded corners
                                        width: '100%', // Ensure the highlight covers the full width
                                        padding: '6px 8px', // Increase padding for better visual appearance
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#6c757d';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="me-2">
                                        <circle cx="12" cy="12" r={size / 2} fill="#000" />
                                    </svg>
                                    {size === 2 ? 'Thin' : size === 5 ? 'Medium' : 'Thick'}
                                </div>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>

                <Button variant="outline-secondary" size="lg" onClick={undoStroke}>
                    <img src="/arrow-rotate-left.svg" alt="Undo" style={fillButtonIconStyle(0.8)} />
                </Button>
                <Button variant="outline-secondary" size="lg" onClick={clearCanvas}>
                    <img src="/trash-can.svg" alt="Clear" style={fillButtonIconStyle(0.7)} />
                </Button>
                <Button variant="outline-secondary" size="lg" onClick={queryAI}>
                    <img src="/lb.svg" alt="Query" style={fillButtonIconStyle(1.25, 40)} />
                </Button>
            </div>
            
            {/* Right side logo */}
            <div>
                <img 
                    src="/b1.png" 
                    alt="Tidal Logo" 
                    style={{
                        height: '32px',
                        width: 'auto',
                        marginRight: '10px'
                    }} 
                />
            </div>
        </div>

    </>
    );
};

export default Toolbar;
