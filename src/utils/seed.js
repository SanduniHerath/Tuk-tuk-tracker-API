import mongoose from 'mongoose';
import 'dotenv/config';
import { Province, District, Tuktuk, Driver, LocationPing, User, PoliceStation } from '../models/index.js';

//in here, I simulate the database with dummy data which contains
//9 provinces, 25 districts, 10 stations, 100 tuk tuk drivers, 100 tuk tuks, 1 week history
const seedDB = async () => {
  try {
    console.log('Starting Simulation Engine...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    //in here, I clear all the existing data to start fresh
    console.log('Wiping existing data for a clean simulation...');
    await Promise.all([
      Province.deleteMany(), District.deleteMany(), PoliceStation.deleteMany(),
      Driver.deleteMany(), Tuktuk.deleteMany(), LocationPing.deleteMany(), User.deleteMany()
    ]);

    //create 9 provinces of Sri Lanka
    const provinceData = [
      { name: 'Western', code: 'WP' }, { name: 'Central', code: 'CP' },
      { name: 'Southern', code: 'SP' }, { name: 'Northern', code: 'NP' },
      { name: 'Eastern', code: 'EP' }, { name: 'North Western', code: 'NW' },
      { name: 'North Central', code: 'NC' }, { name: 'Uva', code: 'UP' },
      { name: 'Sabaragamuwa', code: 'SB' }
    ];
    const insertedProvinces = await Province.insertMany(provinceData);
    const getProv = (code) => insertedProvinces.find(p => p.code === code)._id;

    //create 25 districts in Sri Lanka
    const districtData = [
      { name: 'Colombo', province: getProv('WP') }, { name: 'Gampaha', province: getProv('WP') }, { name: 'Kalutara', province: getProv('WP') },
      { name: 'Kandy', province: getProv('CP') }, { name: 'Matale', province: getProv('CP') }, { name: 'Nuwara Eliya', province: getProv('CP') },
      { name: 'Galle', province: getProv('SP') }, { name: 'Matara', province: getProv('SP') }, { name: 'Hambantota', province: getProv('SP') },
      { name: 'Jaffna', province: getProv('NP') }, { name: 'Kilinochchi', province: getProv('NP') }, { name: 'Mannar', province: getProv('NP') }, { name: 'Vavuniya', province: getProv('NP') }, { name: 'Mullaitivu', province: getProv('NP') },
      { name: 'Batticaloa', province: getProv('EP') }, { name: 'Ampara', province: getProv('EP') }, { name: 'Trincomalee', province: getProv('EP') },
      { name: 'Kurunegala', province: getProv('NW') }, { name: 'Puttalam', province: getProv('NW') },
      { name: 'Anuradhapura', province: getProv('NC') }, { name: 'Polonnaruwa', province: getProv('NC') },
      { name: 'Badulla', province: getProv('UP') }, { name: 'Moneragala', province: getProv('UP') },
      { name: 'Ratnapura', province: getProv('SB') }, { name: 'Kegalle', province: getProv('SB') }
    ];
    const insertedDistricts = await District.insertMany(districtData);
    console.log('Geography Synchronized: 9 Provinces, 25 Districts.\n');

    //create 25 police stations which are mapped to each district
    const stationData = insertedDistricts.map(d => ({
      name: `${d.name} Central Police Station`,
      policeStationCode: `${d.name.substring(0, 3).toUpperCase()}-101`,
      district: d._id,
      province: d.province
    }));
    await PoliceStation.insertMany(stationData);
    console.log('25 Police Stations built.\n');

    //create users (hq admin & station officer)
    const admin = await User.create({
      username: 'hq_admin',
      password: 'password123',
      fullname: 'Master Admin - Police HQ',
      role: 'hq_admin'
    });
    console.log('Administrative Users created (Login: hq_admin / password123)\n');

    //create 100 drivers and 100 tuk tuks
    console.log('Generating 100 vehicles across the island...');
    const driversToInsert = [];
    const tuktuksToInsert = [];

    for (let i = 1; i <= 100; i++) {
      const district = insertedDistricts[i % 25];//spread those drivers and tuk tuks across 25 districts

      const driverId = new mongoose.Types.ObjectId();
      driversToInsert.push({
        _id: driverId,
        fullName: `Driver Name ${i}`,
        nic: `${700000 + i}V`,
        licenseNo: `L-${20000 + i}`,
        district: district._id,
        province: district.province
      });

      tuktuksToInsert.push({
        registrationNo: `${district.name.substring(0, 2)}-${1000 + i}`,
        driver: driverId,
        district: district._id,
        province: district.province,
        status: i % 10 === 0 ? 'flagged' : 'active'
      });
    }

    await Driver.insertMany(driversToInsert);
    const insertedTuktuks = await Tuktuk.insertMany(tuktuksToInsert);
    console.log(`Fleet Ready: 100 Drivers & 100 Tuk-Tuks registered.\n`);

    //simulate location history - movement tracking
    console.log('Generating 1 Week of Simulation movement history...');
    const pingsToInsert = [];
    const sampleSize = 10; //I simulate only for 10 tuk tuks to keep it fast
    const now = new Date();

    for (let i = 0; i < sampleSize; i++) {
      const tuktuk = insertedTuktuks[i];
      for (let day = 0; day < 7; day++) { //7 days of data
        for (let hour = 0; hour < 4; hour++) { //4 pings per day
          pingsToInsert.push({
            tuktuk: tuktuk._id,
            latitude: 6.9271 + (Math.random() - 0.5) * 0.1,
            longitude: 79.8612 + (Math.random() - 0.5) * 0.1,
            speed: Math.floor(Math.random() * 45),
            heading: Math.floor(Math.random() * 360),
            timestamp: new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) - (hour * 2 * 60 * 60 * 1000))
          });
        }
      }
    }
    await LocationPing.insertMany(pingsToInsert);

    console.log('SIMULATION ENGINE COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Total Provinces: 9');
    console.log('Total Districts: 25');
    console.log('Total Tuk-Tuks: 100');
    console.log('Total Drivers: 100');
    console.log('Total Police Stations: 25');
    console.log('Total Location Pings: ' + pingsToInsert.length);
    process.exit(0);
  } catch (err) {
    console.error('SIMULATION FAILED:', err.message);
    process.exit(1);
  }
};

seedDB();
