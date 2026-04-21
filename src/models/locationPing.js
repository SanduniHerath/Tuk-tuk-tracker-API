import mongoose from "mongoose";

//in here I use schema to define the structure of my tuk tuk vehicle data in my MongoDB db
const { Schema } = mongoose;

//this is my tuk tuk model
//this is my main entity where all the tuk tuks being tracked will be stored
//each tuk tuk is linked to a driver, district and province
const locationPingSchema = new Schema(
    {
        tuktuk: {
            type: Schema.Types.ObjectId,
            ref: "Tuktuk",
            required: true,
        },

        latitude: {
            type: Number,
            required: true,
            min: -90, //min valid latitude on Earth
            max: 90, //max valid latitude on Earth
        },
        longitude: {
            type: Number,
            required: true,
            min: -180, //min valid longitude on Earth
            max: 180, //max valid longitude on Earth

        },
        speed: { //speed in km/h
            type: Number,
            default: 0,
        },
        heading: { //direction in degrees - 0 is north, 90 is east, 180 is south, 270 is west
            type: Number,
        },
        accuracy: { //accuracy of the location data in meters
            type: Number,
        },
        timestamp: {
            type: Date,
            default: Date.now, //auto set to the current time
        },
    },

    //this adds createdAt and updatedAt to every doc
    { timestamps: false } //we don't need these bcz we already have our own timestamp field
);

// in here I define indexes to optimize the searching of location pings
locationPingSchema.index({ tuktuk: 1, timestamp: -1 }); //this index helps to quickly find the latest location pings for a specific tuk tuk
//-1 means that the pings will be sorted by timestamp in descending order, so the most recent ping will be found first
locationPingSchema.index({ timestamp: -1 }); //this index helps to quickly find all location pings within a specific time range, which is useful for analytics

//this creates a model class called LocationPing with methods like find(), create(), findById()
//it allows us to interact with the "LocationPing" collection in our MongoDB database
const LocationPing = mongoose.model("LocationPing", locationPingSchema);

//exporting the LocationPing model
export default LocationPing;