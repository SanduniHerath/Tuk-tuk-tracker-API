import mongoose from 'mongoose';
import 'dotenv/config';
import Province from '../models/province.js';
import District from '../models/district.js';
import PoliceStation from '../models/policestation.js';
import Driver from '../models/driver.js';
import TukTuk from '../models/tuktuk.js';
import User from '../models/user.js';
import GPSDevice from '../models/gpsdevice.js';

//this is my seed file
//it populates the db with all 9 provinces, 25 districts, 25 stations, 200 drivers, 200 vehicles, 200 gps devices, and 5 users (one for each role)
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Starting DB Seed (Full Alignment)...');

    //here I clear all the exisitng data for fresh start
    await Promise.all([
      Province.deleteMany(), District.deleteMany(), PoliceStation.deleteMany(),
      Driver.deleteMany(), TukTuk.deleteMany(), User.deleteMany(), GPSDevice.deleteMany()
    ]);

    //create all 9 provinces
    const provinceData = [
      { name: 'Western', code: 'WP' }, { name: 'Central', code: 'CP' },
      { name: 'Southern', code: 'SP' }, { name: 'Northern', code: 'NP' },
      { name: 'Eastern', code: 'EP' }, { name: 'North Western', code: 'NW' },
      { name: 'North Central', code: 'NC' }, { name: 'Uva', code: 'UP' },
      { name: 'Sabaragamuwa', code: 'SB' }
    ];
    const insertedProvinces = await Province.insertMany(provinceData);

    const getProv = (code) => insertedProvinces.find(p => p.code === code)._id;

    //create 25 districts and link to provinces
    const districtData = [
      { name: 'Colombo', province: getProv('WP'), code: 'COL' }, { name: 'Gampaha', province: getProv('WP'), code: 'GAM' }, { name: 'Kalutara', province: getProv('WP'), code: 'KAL' },
      { name: 'Kandy', province: getProv('CP'), code: 'KND' }, { name: 'Matale', province: getProv('CP'), code: 'MTL' }, { name: 'Nuwara Eliya', province: getProv('CP'), code: 'NPR' },
      { name: 'Galle', province: getProv('SP'), code: 'GAL' }, { name: 'Matara', province: getProv('SP'), code: 'MTR' }, { name: 'Hambantota', province: getProv('SP'), code: 'HBT' },
      { name: 'Jaffna', province: getProv('NP'), code: 'JAF' }, { name: 'Kilinochchi', province: getProv('NP'), code: 'KNL' }, { name: 'Mannar', province: getProv('NP'), code: 'MNR' }, { name: 'Vavuniya', province: getProv('NP'), code: 'VVN' }, { name: 'Mullaitivu', province: getProv('NP'), code: 'MLT' },
      { name: 'Batticaloa', province: getProv('EP'), code: 'BTC' }, { name: 'Ampara', province: getProv('EP'), code: 'AMP' }, { name: 'Trincomalee', province: getProv('EP'), code: 'TRK' },
      { name: 'Kurunegala', province: getProv('NW'), code: 'KGN' }, { name: 'Puttalam', province: getProv('NW'), code: 'PTL' },
      { name: 'Anuradhapura', province: getProv('NC'), code: 'AD' }, { name: 'Polonnaruwa', province: getProv('NC'), code: 'PLP' },
      { name: 'Badulla', province: getProv('UP'), code: 'BDA' }, { name: 'Moneragala', province: getProv('UP'), code: 'MNR' },
      { name: 'Ratnapura', province: getProv('SB'), code: 'RT' }, { name: 'Kegalle', province: getProv('SB'), code: 'KGE' }
    ];
    const insertedDistricts = await District.insertMany(districtData);

    //create 25 police stations (one for each district)
    const stationData = insertedDistricts.map((d, i) => ({
      name: `${d.name} Central Police Station`,
      stationCode: `${d.name.substring(0, 3).toUpperCase()}-${101 + i}`,
      district: d._id,
      province: d.province
    }));
    await PoliceStation.insertMany(stationData);

    //in here, I create 5 users for each role
    await User.create([
      //role 1 hq admin (full access to everything)
      { username: 'admin', password: 'password123', fullName: 'HQ Master Admin', role: 'hq_admin' },

      //role 2 provincial officer
      {
        username: 'wp_officer',
        password: 'password123',
        fullName: 'Western Province Officer',
        role: 'provincial_officer',
        province: getProv('WP')
      },

      //role 3 station officer (scoped only to one station: Colombo Central Police Station)
      {
        username: 'colombo_officer',
        password: 'password123',
        fullName: 'Colombo Station Officer',
        role: 'station_officer',
        station: stationData.find(s => s.name === 'Colombo Central Police Station')._id,
        province: getProv('WP'),
        district: insertedDistricts.find(d => d.name === 'Colombo')._id
      }
    ]);

    //in here, the seed generates 200 vehicles, drivers, and gps devices distributed across all districts
    console.log('🚕 Generating 200 vehicles across all districts...');

    const sinhalaFirstNames = ['Kasun', 'Nuwan', 'Chamara', 'Sajith', 'Ruwan', 'Pradeep', 'Lasith', 'Dinesh', 'Asanka', 'Mahesh',
      'Chathura', 'Buddhika', 'Saman', 'Aruna', 'Nimal', 'Harsha', 'Dulith', 'Isuru', 'Gayan', 'Thilina'];
    const sinhalaLastNames = ['Perera', 'Silva', 'Fernando', 'Dissanayake', 'Rajapaksa', 'Wickramasinghe', 'Gunawardena',
      'Jayawardena', 'Bandara', 'Kumara', 'Senanayake', 'Wijesinghe', 'Ranasinghe', 'Mahalingam', 'Pathirana'];

    const vehiclesToInsert = [];
    const driversToInsert = [];
    const gpstrackersToInsert = [];

    for (let i = 1; i <= 200; i++) {
      const district = insertedDistricts[i % insertedDistricts.length];
      const driverId = new mongoose.Types.ObjectId();
      const gpstrackerId = new mongoose.Types.ObjectId();
      const vehicleId = new mongoose.Types.ObjectId();
      const firstName = sinhalaFirstNames[i % sinhalaFirstNames.length];
      const lastName = sinhalaLastNames[i % sinhalaLastNames.length];


      driversToInsert.push({
        _id: driverId,
        fullName: `${firstName} ${lastName}`,
        nationalId: `${String(195000000 + i).padStart(9, '0')}V`,
        licenseNumber: `B${String(1000000 + i).padStart(7, '0')}`,
        phone: `07${String(10000000 + i).slice(-8)}`,
        district: district._id,
        province: district.province
      });

      vehiclesToInsert.push({
        _id: vehicleId,
        registrationNumber: `REG${100 + i}`,
        driver: driverId,
        district: district._id,
        province: district.province,
        deviceId: `DEV-${String(10000 + i).padStart(5, '0')}`,
        color: ['Yellow', 'Blue', 'Green'][i % 3],
        year: 2010 + (i % 15),
        status: i % 15 === 0 ? 'flagged' : 'active'
      });

      gpstrackersToInsert.push({
        _id: gpstrackerId,
        vehicle: vehicleId,
        deviceId: `DEV-${String(10000 + i).padStart(5, '0')}`,
        isActive: true
      });
    }

    await Driver.insertMany(driversToInsert);
    const insertedVehicles = await TukTuk.insertMany(vehiclesToInsert);
    const insertedGPSTrackers = await GPSDevice.insertMany(gpstrackersToInsert);

    //role 4 tuktuk operator (manage all the tuktuks and drivers)
    await User.create({
      username: 'TT-Saman',
      password: 'password123',
      fullName: 'TT-Saman',
      role: 'tuk_tuk_operator',
    });

    //role 5 gps device (not a human user, but a device user for testing device-level auth and pings) 
    await User.create({
      username: 'gps_device',
      password: 'password123',
      fullName: 'GPS Device',
      role: 'gps_device',
      vehicle: insertedVehicles[0]._id,
      gpstracker: insertedGPSTrackers[0]._id
    });

    console.log(`\n SEED COMPLETE:`);
    console.log(`  9 Provinces | 25 Districts | 25 Stations`);
    console.log(`   200 Vehicles | 200 Drivers | 200 GPSTrackers`);
    console.log(`   Users: admin / wp_officer / colombo_officer / tuk_tuk_operator/ gps_device`);
    console.log(`\n Now run: node src/utils/simulate.js   ← for live ongoing pings`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
