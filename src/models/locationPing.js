import mongoose from "mongoose";

const { Schema } = mongoose;

// This is the LocationPing model, which represents a single GPS ping sent by a tuk tuk's GPS tracker.
const locationPingSchema = new Schema(
  {
    
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Tuktuk',
      required: true,
    },

    //these are the gps cordinates of the ping
    latitude: {
      type: Number,
      required: true,
      min: -90, 
      max: 90,  
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180, 
    },

    //these are additional movement data that can be used for anomaly detection and alerts
    speed: {
      type: Number,
      default: 0,  
    },
    heading: {
      type: Number,//heading means directions in degrees 0-north, 90-east, 180-south, 270-west
    },
    accuracy: {
      type: Number, //gps accuracy in meters, lower is better
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    //this field is used to identify whether the ping is suspicious or not
    //false means normal behavior
    isAnomaly: {
      type: Boolean,
      default: false,
    },

   //if isAnomaly is true, this field specifies the type of anomaly detected
    anomaly: {
      type: String,
      enum: [
        'NIGHT_MOVEMENT', //this pattern is detected when a tuk tuk moves between 11pm and 5am
        'SPEEDING', //this pattern is detected when a tuk tuk exceeds a certain speed threshold (e.g. 80 km/h)
        'BOUNDARY_CROSS',//this pattern is detected when a tuk tuk leaves a predefined geofence area
        'STATIONARY',//this pattern recognized when a tuk tuk remains in the same location for an unusually long time (e.g. more than 4 hours)
        'ERRATIC',//this pattern is detected when a tuk tuk movements are erratic which means it shows sudden changes in tuk tuk movements
        null,//this means normal behavior
      ],
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

//easy to retrive the latest live location of a tuk tuk
locationPingSchema.index({ vehicle: 1, timestamp: -1 });

//easy to retrive the latest anomalies for a tuk tuk
locationPingSchema.index({ isAnomaly: 1, timestamp: -1 });

//easy to retrive all pings for tuk tuk in a time range for historical playback
locationPingSchema.index({ timestamp: -1 });

//easy to retrive and filter anomalies
locationPingSchema.index({ vehicle: 1, anomaly: 1, timestamp: -1 });


const LocationPing = mongoose.model("LocationPing", locationPingSchema);
export default LocationPing;