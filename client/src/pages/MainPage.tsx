import { useEffect, useState } from "react";
import DrawingCanvas from "./Draw";
import './SearchStyle.css';
import InputText from './Search';

export default () => {


  return (
    <div className="main">
      <InputText />
    </div>
  );


  useEffect(() => {

  }, []);

  return (
    <div className="main">
      <h1>Hello World</h1>
        <DrawingCanvas />
    </div>
  );
};
