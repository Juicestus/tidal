import express from "express";
import cors from "cors";
import * as routes from "./routes";
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));

// If you use urlencoded forms anywhere:
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.json());

app.use(cors());
app.options("*", cors());


app.post("/query", asyncHandler(routes.query));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

