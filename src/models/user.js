import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

//in here I use schema to define the structure of my user data in my MongoDB db
const { Schema } = mongoose;

//this is my user model
//in here I store information about users who can log in to the system. These are the admin users who can manage the tuk tuk tracking system

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true 
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false //this means that when we query for users, the password field will not be included by default. This is a security measure to prevent accidental exposure of passwords.
        },
        fullname: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["hq_admin", "provincial_officer", "station_officer", 'gps_device'], //this means that the user's role can only be one of these 5 values
            required: true
        },

        //scope fields to define the user's access level in the system
        //An HQ admin can see and manage everything without any restrictions
        //A provincal officer can only see and manage their relevant province
        //A station officer has province and district level access
        province: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "Province", //in here I tells Mongoose this links to the Province model
         },
        district: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "District", //in here I tells Mongoose this links to the District model
         },
         policeStation: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "PoliceStation", //in here I tells Mongoose this links to the PoliceStation model
         },
         tuktuk: {
            type: Schema.Types.ObjectId, //ObjectID used to stores the ID of another doc like a foreign key in SQL
            ref: "Tuktuk", //in here I tells Mongoose this links to the Tuktuk model
         },
        isActive: {
            type: Boolean,
            default: true
        },
    },

    //this adds createdAt and updatedAt to every doc
    { timestamps: true }
);

//In here I use hashpassword before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()//if the password isn't modified, no need to hash it again, just move to next middleware
    this.password = await bcryptjs.hash(this.password, 12); //hash the password with a salt round of 12
    next();
});

//In here I define a method to compare passwords at login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs.compare(candidatePassword, this.password); //compare the candidate password with the hashed password in the db
};

//this creates a model class called User with methods like find(), create(), findById()
//it allows us to interact with the "User" collection in our MongoDB database
const User = mongoose.model("User", userSchema);

//exporting the User model
export default User;