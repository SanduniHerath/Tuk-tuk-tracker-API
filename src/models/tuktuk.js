import mongoose from "mongoose";

//in here I use schema to define the structure of my tuk tuk vehicle data in my MongoDB db
const { Schema } = mongoose;

//this is my tuk tuk model
//this is my main entity where all the tuk tuks being tracked will be stored
//each tuk tuk is linked to a driver, district and province
const tuktukSchema = new Schema(
    {
        registrationNumber: {
            type: String,
            required: true,
            unique: true, //this means that no 2 tuktuks can have the same registration number
            uppercase: true,
            trim: true //this means that any extra spaces from start and end of the registration number will be automatically removed
        },
        driver: {
            type: Schema.Types.ObjectId, //A vehicle can have a driver but this can be optional
            ref: "Driver",
        },
        district: {
            type: Schema.Types.ObjectId,
            ref: "District",
            required: true
        },
        province: {
            type: Schema.Types.ObjectId,
            ref: "Province",
            required: true
        },
        deviceId: {
            type: String,
            unique: true, //this means that no 2 tuktuks can have the same device ID
            sparse: true //this allows multiple tuktuks to have a null device ID, but if a device ID is provided it must be unique
        },
        isActive: {
            type: Boolean,
            default: true //new tuktuks are active by default
        },
        status: {
            type: String,
            //enum means that the tuk tuk's status can only be one of these 3 values
            enum: ["active", "inactive", "flagged"],
            default: "active"
        },
        color: {
            type: String,
        },
        year: {
            type: Number,
        },
    },


    //this adds createdAt and updatedAt to every doc
    { timestamps: true }
);

//in here I define indexes to optimize the searching of tuk tuks
//bcz, without indexes, MongoDB have to read every doc to find matches
//with these indexes, it can quickly find relevant tuk tuks. This matters a lot when I have 200+ vehicles in the db
tuktukSchema.index({ district: 1, status: 1 }); //this index helps to quickly find all active tuktuks in a specific district
tuktukSchema.index({ province: 1, status: 1 }); //this index helps to quickly find all active tuktuks in a specific province

//this creates a model class called Tuktuk with methods like find(), create(), findById()
//it allows us to interact with the "Tuktuk" collection in our MongoDB database
const Tuktuk = mongoose.model("Tuktuk", tuktukSchema);

//exporting the Tuktuk model
export default Tuktuk;