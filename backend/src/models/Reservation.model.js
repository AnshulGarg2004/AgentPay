import mongoose from "mongoose";

const { Schema } = mongoose;

const ReservationSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes default TTL
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
