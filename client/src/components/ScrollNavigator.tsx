import React from 'react';

interface ScrollNavigatorProps {
  canvasHeight: number;
  viewportHeight: number;
  scrollPosition: number;
  onPositionChange: (position: number) => void;
}

const ScrollNavigator: React.FC<ScrollNavigatorProps> = ({ 
  canvasHeight, 
  viewportHeight, 
  scrollPosition,
  onPositionChange 
}) => {
  const scrollRatio = viewportHeight / canvasHeight;
  const currentPosition = scrollPosition / (canvasHeight - viewportHeight);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const barHeight = e.currentTarget.clientHeight;
    const clickY = e.nativeEvent.offsetY;
    const ratio = clickY / barHeight;
    const newPosition = Math.max(0, Math.min(ratio * (canvasHeight - viewportHeight), canvasHeight - viewportHeight));
    
    onPositionChange(newPosition);
  };
  
  return (
    <div 
      className="scroll-navigator" 
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: '10px',
        top: '60px', // Below toolbar
        height: 'calc(100vh - 80px)',
        width: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '10px',
        zIndex: 1000,
        cursor: 'pointer'
      }}
    >
      <div
        className="scroll-indicator"
        style={{
          position: 'absolute',
          top: `${currentPosition * 100 * (1 - scrollRatio)}%`,
          width: '100%',
          height: `${scrollRatio * 100}%`,
          minHeight: '30px',
          backgroundColor: '#999',
          borderRadius: '10px',
        }}
      />
    </div>
  );
};

export default ScrollNavigator;
