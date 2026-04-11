import mongoose from "mongoose";

//in here I use schema to define the structure of my province data in my MongoDB db
const { Schema } = mongoose;

//this is my province model
//in here I store Sri Lanka's 9 provinces
//as an ex: { name: "Central", code: "C" }
const policeStationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true //this means that any extra spaces from start and end of the name will be automatically removed
        },
        policeStationCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        district: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "District", //in here I tells Mongoose this links to the District model
            required: true
        },
        province: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "Province", //in here I tells Mongoose this links to the Province model
            required: true
        },
        address: {
            type: String,
        },
        contactNumber: {
            type: String,
        },  
    },

    //this adds createdAt and updatedAt to every doc
    { timestamps: true }
);

//this creates a model class called PoliceStation with methods like find(), create(), findById()
//it allows us to interact with the "PoliceStation" collection in our MongoDB database
const PoliceStation = mongoose.model("PoliceStation", policeStationSchema);

//exporting the PoliceStation model
export default PoliceStation;