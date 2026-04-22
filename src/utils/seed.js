import mongoose from 'mongoose';
import 'dotenv/config';
import { Province, District, Tuktuk, Driver, LocationPing, User, PoliceStation } from '../models/index.js';

//this is my data simulation script
//it includes - 9 provinces, 25 districts, 25 police stations, 200 tuk tuks, 200 drivers, 1 week history, 3 users (hq admin, station officer, device)
const seedDB = async () => {
  try {
    console.log('Starting data simulation');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    //clear existing data in the db to start fresh
    console.log('clear data for clean simulation');
    await Promise.all([
      Province.deleteMany(), District.deleteMany(), PoliceStation.deleteMany(),
      Driver.deleteMany(), Tuktuk.deleteMany(), LocationPing.deleteMany(), User.deleteMany()
    ]);

    //create 9 provinces
    const provinceData = [
      { name: 'Western', code: 'WP' }, { name: 'Central', code: 'CP' },
      { name: 'Southern', code: 'SP' }, { name: 'Northern', code: 'NP' },
      { name: 'Eastern', code: 'EP' }, { name: 'North Western', code: 'NW' },
      { name: 'North Central', code: 'NC' }, { name: 'Uva', code: 'UP' },
      { name: 'Sabaragamuwa', code: 'SB' }
    ];
    const insertedProvinces = await Province.insertMany(provinceData);
    const getProv = (code) => insertedProvinces.find(p => p.code === code)._id;

    //create 25 districts
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
    console.log('9 Provinces, 25 Districts Synchronized.\n');

    //create 25 police stations
    const stationData = insertedDistricts.map((d, i) => ({
      name: `${d.name} Central Police Station`,
      policeStationCode: `${d.name.substring(0, 3).toUpperCase()}-${101 + i}`,
      district: d._id,
      province: d.province
    }));
    const insertedStations = await PoliceStation.insertMany(stationData);
    console.log('25 police stations established\n');

    //create 200 tuk tuks and drivers
    console.log('Generating 200 tuktuks and drivers across Sri Lanka');
    const driversToInsert = [];
    const tuktuksToInsert = [];

    for (let i = 1; i <= 200; i++) {
      const district = insertedDistricts[i % 25];
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
        registrationNo: `${district.name.substring(0, 2).toUpperCase()}-${1000 + i}`,
        driver: driverId,
        district: district._id,
        province: district.province,
        status: i % 20 === 0 ? 'flagged' : 'active'
      });
    }
    await Driver.insertMany(driversToInsert);
    const insertedTuktuks = await Tuktuk.insertMany(tuktuksToInsert);
    console.log('200 tuk tuks successfully registered\n');

    //create users - hq admin, station officer, device
    const colombo = insertedDistricts.find(d => d.name === 'Colombo');
    await User.create([
      { username: 'hq_admin', password: 'password123', fullname: 'Master Admin', role: 'hq_admin' },
      { username: 'station_officer', password: 'password123', fullname: 'Colombo Officer', role: 'station_officer', district: colombo._id, policeStation: insertedStations[0]._id },
      { username: 'device_001', password: 'password123', fullname: 'Tuk-Tuk Tracking Device', role: 'device', tuktuk: insertedTuktuks[0]._id }
    ]);
    console.log('HQ, station, and device accounts created.\n');

    //generate 1 week location history
    console.log('Generating one week of location history');
    const pingsToInsert = [];
    const sampleVehicles = insertedTuktuks.slice(0, 15); //15 tuk tuks for location history
    const now = new Date();

    for (const vehicle of sampleVehicles) {
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 4; hour++) {
          pingsToInsert.push({
            tuktuk: vehicle._id,
            latitude: 6.9271 + (Math.random() - 0.5) * 0.1,
            longitude: 79.8612 + (Math.random() - 0.5) * 0.1,
            speed: Math.floor(Math.random() * 40),
            timestamp: new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) - (hour * 2 * 60 * 60 * 1000))
          });
        }
      }
    }
    await LocationPing.insertMany(pingsToInsert);

    console.log('Data simulation completed');
    console.log('----------------------------------------------------');
    console.log('Total Provinces: 9');
    console.log('Total Districts: 25');
    console.log('Total Police Stations: 25');
    console.log('Total Tuk-Tuks: 200');
    console.log('History Duration: 7 Days');
    process.exit(0);
  } catch (err) {
    console.error('SIMULATION FAILED:', err.message);
    process.exit(1);
  }
};

seedDB();
