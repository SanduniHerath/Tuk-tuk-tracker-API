//this is the test seed script which generate testing data
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  Province, District, PoliceStation,
  Driver, Tuktuk, LocationPing, User
} from '../../src/models/index.js';

export const TEST_PREFIX = 'TEST__';

//registration numbers used across test files
export const REG = {
  v1: 'TEST-WP-COL-0001',
  v2: 'TEST-WP-COL-0002',
  v3: 'TEST-WP-GAM-0001',
  v4: 'TEST-CP-KAN-0001',
  v5: 'TEST-CP-KAN-0002',
};

//test nics
export const NIC = {
  d1: '900000001V',
  d2: '900000002V',
  d3: '900000003V',
  d4: '900000004V',
  d5: '900000005V',
};

//test police station codes
export const PS_CODE = {
  colombo: 'PS-COL-001',
  gampaha: 'PS-GAM-001',
  kandy:   'PS-KAN-001',
};


export const seedTestData = async () => {
  //clear collections
  await Promise.all([
    Province.deleteMany({}),
    District.deleteMany({}),
    PoliceStation.deleteMany({}),
    Driver.deleteMany({}),
    Tuktuk.deleteMany({}),
    LocationPing.deleteMany({}),
    User.deleteMany({}),
  ]);

  //create hierarchy
  const [western, central] = await Province.insertMany([
    { name: `${TEST_PREFIX}Western`, code: 'TWP' },
    { name: `${TEST_PREFIX}Central`, code: 'TCP' },
  ]);

 
  const [colombo, gampaha, kandy] = await District.insertMany([
    { name: `${TEST_PREFIX}Colombo`, code: 'TCOL', province: western._id },
    { name: `${TEST_PREFIX}Gampaha`, code: 'TGAM', province: western._id },
    { name: `${TEST_PREFIX}Kandy`,   code: 'TKAN', province: central._id },
  ]);

  
  const [colPS, gamPS, kanPS] = await PoliceStation.insertMany([
    {
      name: `${TEST_PREFIX}Colombo PS`,
      policeStationCode: PS_CODE.colombo,
      district: colombo._id,
      province: western._id,
      address: '1 Colombo Road',
      contactNumber: '0112000001',
    },
    {
      name: `${TEST_PREFIX}Gampaha PS`,
      policeStationCode: PS_CODE.gampaha,
      district: gampaha._id,
      province: western._id,
      address: '1 Gampaha Road',
      contactNumber: '0332000001',
    },
    {
      name: `${TEST_PREFIX}Kandy PS`,
      policeStationCode: PS_CODE.kandy,
      district: kandy._id,
      province: central._id,
      address: '1 Kandy Road',
      contactNumber: '0812000001',
    },
  ]);

  
  const [d1, d2, d3, d4, d5] = await Driver.insertMany([
    { fullName: 'Test Driver One',   nic: NIC.d1, licenseNo: 'TL-00001', district: colombo._id, province: western._id },
    { fullName: 'Test Driver Two',   nic: NIC.d2, licenseNo: 'TL-00002', district: colombo._id, province: western._id },
    { fullName: 'Test Driver Three', nic: NIC.d3, licenseNo: 'TL-00003', district: gampaha._id, province: western._id },
    { fullName: 'Test Driver Four',  nic: NIC.d4, licenseNo: 'TL-00004', district: kandy._id,   province: central._id },
    { fullName: 'Test Driver Five',  nic: NIC.d5, licenseNo: 'TL-00005', district: kandy._id,   province: central._id },
  ]);

  
  const [v1, v2, v3, v4, v5] = await Tuktuk.insertMany([
    { registrationNumber: REG.v1, driver: d1._id, district: colombo._id, province: western._id, status: 'active',   color: 'Blue',  year: 2020 },
    { registrationNumber: REG.v2, driver: d2._id, district: colombo._id, province: western._id, status: 'active',   color: 'Green', year: 2021 },
    { registrationNumber: REG.v3, driver: d3._id, district: gampaha._id, province: western._id, status: 'inactive', color: 'Red',   year: 2019 },
    { registrationNumber: REG.v4, driver: d4._id, district: kandy._id,   province: central._id, status: 'flagged',  color: 'White', year: 2022 },
    { registrationNumber: REG.v5, driver: d5._id, district: kandy._id,   province: central._id, status: 'active',   color: 'Black', year: 2023 },
  ]);

  //here create 10 location pings per vehicle by mixing of both normal and anomalous
  const now = new Date();
  const pings = [];

  const vehicles = [v1, v2, v3, v4, v5];
  const anomalyTypes = ['NIGHT_MOVEMENT', 'SPEEDING', 'BOUNDARY_CROSS', 'STATIONARY', 'ERRATIC'];

  for (const vehicle of vehicles) {
    for (let i = 0; i < 10; i++) {
      const isAnomaly = i < 4; //first location pings per tuktuks are anomolous
      pings.push({
        vehicle: vehicle._id,
        latitude:  6.9 + (i * 0.001),
        longitude: 79.8 + (i * 0.001),
        speed: isAnomaly ? 95 + i : 30 + i,
        heading: 90,
        accuracy: 5,
        timestamp: new Date(now.getTime() - (i * 60 * 60 * 1000)),
        isAnomaly,
        anomaly: isAnomaly ? anomalyTypes[i % anomalyTypes.length] : null,
      });
    }
  }
  await LocationPing.insertMany(pings);

  
  const hashedPw = await bcrypt.hash('Test@1234', 12);

  const [adminUser, provinceUser, stationUser, deviceUser] = await User.insertMany([
    {
      username: 'test_hq_admin',
      password: hashedPw,
      fullname: 'Test HQ Admin',
      role: 'hq_admin',
      isActive: true,
    },
    {
      username: 'test_province_officer',
      password: hashedPw,
      fullname: 'Test Province Officer',
      role: 'provincial_officer',
      province: western._id,
      isActive: true,
    },
    {
      username: 'test_station_officer',
      password: hashedPw,
      fullname: 'Test Station Officer',
      role: 'station_officer',
      province: western._id,
      district: colombo._id,
      isActive: true,
    },
    {
      username: 'test_gps_device',
      password: hashedPw,
      fullname: 'Test GPS Device',
      role: 'gps_device',
      tuktuk: v1._id,
      isActive: true,
    },
  ]);

  
  return {
   //province ids or name
    westernId:  western._id.toString(),
    centralId:  central._id.toString(),
    westernName: `${TEST_PREFIX}Western`,
    centralName: `${TEST_PREFIX}Central`,

    //district ids or name
    colomboId:   colombo._id.toString(),
    gampahaId:   gampaha._id.toString(),
    kandyId:     kandy._id.toString(),
    colomboName: `${TEST_PREFIX}Colombo`,
    gampahaName: `${TEST_PREFIX}Gampaha`,
    kandyName:   `${TEST_PREFIX}Kandy`,

    //station codes
    colomboPS: PS_CODE.colombo,
    gampahaPS: PS_CODE.gampaha,
    kandyPS:   PS_CODE.kandy,

    //nic of drivers
    driverNic1: NIC.d1,
    driverNic2: NIC.d2,
    driverNic3: NIC.d3,

    //tuk tuk reg nos
    regV1: REG.v1,
    regV2: REG.v2,
    regV3: REG.v3,
    regV4: REG.v4,
    regV5: REG.v5,

    //vehicle object ids for ping sumbit
    vehicleId1: v1._id.toString(),
    vehicleId2: v2._id.toString(),

    //user ref
    adminId:   adminUser._id.toString(),
    deviceUserId: deviceUser._id.toString(),
  };
};

//clear test data
export const clearTestData = async () => {
  
  await LocationPing.deleteMany({});
  await Tuktuk.deleteMany({
    registrationNumber: { $in: Object.values(REG) }
  });
  await Driver.deleteMany({ nic: { $in: Object.values(NIC) } });
  await PoliceStation.deleteMany({
    policeStationCode: { $in: Object.values(PS_CODE) }
  });
  await District.deleteMany({ name: { $regex: `^${TEST_PREFIX}` } });
  await Province.deleteMany({ name: { $regex: `^${TEST_PREFIX}` } });
  await User.deleteMany({ username: { $regex: '^test_' } });
};
