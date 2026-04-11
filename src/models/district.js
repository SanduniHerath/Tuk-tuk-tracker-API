import mongoose from "mongoose";

//in here I use schema to define the structure of my province data in my MongoDB db
const { Schema } = mongoose;

//this is my district model
//in here I store Sri Lanka's 25 districts
//each district has a relationship with a province, meaning that each district belongs to one province
//as an ex: { name: "Colombo", province: <Province_ID> }
const districtSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true //this means that any extra spaces from start and end of the name will be automatically removed
        },
       province: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "Province", //in here I tells Mongoose this links to the Province model
            required: true
       }
    },

    //this adds createdAt and updatedAt to every doc
    { timestamps: true }
);

//this creates a model class called District with methods like find(), create(), findById()
//it allows us to interact with the "District" collection in our MongoDB database
const District = mongoose.model("District", districtSchema);

//exporting the District model
export default District;