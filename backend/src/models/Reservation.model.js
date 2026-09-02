import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema({}, { timestamps: true });
export default mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
