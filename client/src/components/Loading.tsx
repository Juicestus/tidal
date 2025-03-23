
import CircularProgress from "@mui/material/CircularProgress";

import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const Loading = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%'
      }}>
        <CircularProgress color="success" />
      </div>
    );
  };
  
  const CanvasLoading = ({ xPos, yPos }: { xPos: number, yPos: number }) => {
    return (
      <Html>
        <div style={{
          padding: '8px',
          background: 'rgba(255, 255, 255, 1.0)',
          border: '1px solid #ddd',
          borderRadius: '0.75rem',
          position: 'absolute',
          top: yPos + 'px',
          left: xPos + 'px',
          width: '800px',
          height: '70px', // ✅ reduced height
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Loading />
        </div>
      </Html>
    );
  };
  

export default CanvasLoading;
