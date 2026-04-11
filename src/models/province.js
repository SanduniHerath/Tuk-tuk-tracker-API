import mongoose from "mongoose";

//in here I use schema to define the structure of my province data in my MongoDB db
const { Schema } = mongoose;

//this is my province model
//in here I store Sri Lanka's 9 provinces
//as an ex: { name: "Central", code: "C" }
const provinceSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, //this means that no 2 provinces can have the same name
            trim: true //this means that any extra spaces from start and end of the name will be automatically removed
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
    },

    //this adds createdAt and updatedAt to every doc
    { timestamps: true }
);

//this creates a model class called Province with methods like find(), create(), findById()
//it allows us to interact with the "Province" collection in our MongoDB database
const Province = mongoose.model("Province", provinceSchema);

//exporting the Province model
export default Province;