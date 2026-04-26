import mongoose from "mongoose";

//in here I use schema to define the structure of my tuk tuk driver data in my MongoDB db
const { Schema } = mongoose;

//this is my driver model
//in here I store information about tuk tuk drivers
//each driver is linked to a district and province
//as an ex: { fullName: "Nimal Perera", nic: "901234567V", licenseNo: "LT-12345" }
const driverSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true //this means that any extra spaces from start and end of the name will be automatically removed
        },
        nic: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        licenseNo: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        contactNumber: {
            type: String,
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
        isActive: {
            type: Boolean,
            default: true //new drivers are active by default
        },
    },

    { timestamps: true }
);


const Driver = mongoose.model("Driver", driverSchema);
export default Driver;