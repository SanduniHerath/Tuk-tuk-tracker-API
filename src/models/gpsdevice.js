import mongoose from "mongoose";

const { Schema } = mongoose;
//this is my gps tracker model
const gpsTrackerSchema = new Schema(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle", // links to Vehicle model
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const GPSTracker = mongoose.model("GPSTracker", gpsTrackerSchema);

export default GPSTracker;