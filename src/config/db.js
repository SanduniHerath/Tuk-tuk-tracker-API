import mongoose from "mongoose";

import dns from 'dns';
import 'dotenv/config';

//here I use Google DNS for only this session
dns.setServers(['8.8.8.8','8.8.4.4']);

const connectDB = async () => {
    try {
        //in here I connect my MongoDB Atlas using the URI from my .env file
        //mongoose.connect() returns a promise, so I await it to ensure the connection is established before proceeding
        const conn = await mongoose.connect(process.env.MONGO_URI);

        //if my conncection is successful, I log a message to print which server I connected to
        console.log(`My MongoDB successfully connected to: ${conn.connection.name}`);
    } catch (error) {
        //if it catch an error while tryting to connect, I print the error msg
        console.error(`My MongoDB connection failed, the error is: ${error.message}`);

        //in here I stop entire app becuase no point running without a db
        process.exit(1);

    }
};

export default connectDB;