import mongoose from "mongoose";

const { Schema } = mongoose;

const ReservationSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", index: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
