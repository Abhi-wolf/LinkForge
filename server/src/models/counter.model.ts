import mongoose, { Document } from "mongoose";

export interface ICounter extends Document {
  counterValue: number;
}

const counterSchema = new mongoose.Schema(
  {
    counterValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Counter = mongoose.model<ICounter>("Counter", counterSchema);

export default Counter;
