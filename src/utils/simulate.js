//this is my live simulation engine that generates location pings every 10 seconds for all active vehicles in the database. 
//It simulates both normal and suspicious behaviour patterns to test the anomaly detection capabilities of the system

//I divide ratios of normal and suspicious vehicles as 80% normal and 20% suspicious
//normal vehicles identified as those that
//1. operate during only day hours (6am-9pm)
//2. stay within their assigned district
//3. have realistic speed patterns (under 60 km/h)
//4. have consistent movement patterns (not erratic zigzags)
//5. are parked at night (no movement)

//suspicious vehicles are identified as those that exhibit one of the following patterns
//I divided those patterns into 5 types like below:
//1.night movement pattern
//2.speeding pattern
//3.boundary crossing pattern
//4.stationary pattern - which means stopped in the same location for too long
//5.erratic movement pattern - which means irregular zigzag movement that does not follow roads
import mongoose from 'mongoose';
import 'dotenv/config';
import { Vehicle, LocationPing } from '../models/index.js';


//here I setup all the config params
const CONFIG = {
  //how often to generate pings (10seconds)
  INTERVAL_MS: 10000,
  SUSPICIOUS_RATIO: 0.20,

  //here i define speed thresholds (km/h)
  NORMAL_MAX_SPEED: 55,         
  SPEEDING_MIN: 80,             
  SPEEDING_MAX: 120,            

  //night hours detection
  NIGHT_START: 23,              
  NIGHT_END: 5,                 

  //in here i define the assigned district boundary violation
  //0.5 degrees - 5.5 km
  BOUNDARY_VIOLATION_OFFSET: 0.5,

  //normal movement range in degrees 
  //0.0008 degrees is roughly 90 metres
  NORMAL_MOVEMENT: 0.0008,

  //erratic movement range in degrees
  //0.005 degrees is roughly 550 metres - abnormal for a tuk tuk in 10s
  ERRATIC_MOVEMENT: 0.005,
};

//here I define district based cordination so that the system can identify boundary crossing patterns
const DISTRICT_CENTERS = {
  'Colombo': { lat: 6.9271, lng: 79.8612 },
  'Gampaha': { lat: 7.0873, lng: 79.9998 },
  'Kalutara': { lat: 6.5854, lng: 79.9607 },
  'Kandy': { lat: 7.2906, lng: 80.6337 },
  'Matale': { lat: 7.4675, lng: 80.6234 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
  'Galle': { lat: 6.0535, lng: 80.2210 },
  'Matara': { lat: 5.9549, lng: 80.5550 },
  'Hambantota': { lat: 6.1241, lng: 81.1185 },
  'Jaffna': { lat: 9.6615, lng: 80.0255 },
  'Kilinochchi': { lat: 9.3803, lng: 80.3770 },
  'Mannar': { lat: 8.9761, lng: 79.9044 },
  'Vavuniya': { lat: 8.7514, lng: 80.4971 },
  'Mullaitivu': { lat: 9.2671, lng: 80.8128 },
  'Batticaloa': { lat: 7.7170, lng: 81.6924 },
  'Ampara': { lat: 7.2975, lng: 81.6714 },
  'Trincomalee': { lat: 8.5874, lng: 81.2152 },
  'Kurunegala': { lat: 7.4863, lng: 80.3621 },
  'Puttalam': { lat: 8.0362, lng: 79.8283 },
  'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
  'Polonnaruwa': { lat: 7.9403, lng: 81.0188 },
  'Badulla': { lat: 6.9934, lng: 81.0550 },
  'Moneragala': { lat: 6.8728, lng: 81.3506 },
  'Ratnapura': { lat: 6.7056, lng: 80.3847 },
  'Kegalle': { lat: 7.2513, lng: 80.3464 },
};
//here I define a helper function to add some random movement to the tuk tuks in each round
const nudge = (value, range = CONFIG.NORMAL_MOVEMENT) => {
  return value + (Math.random() - 0.5) * 2 * range;
};

const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= CONFIG.NIGHT_START || hour < CONFIG.NIGHT_END;
};
//here I define a helper function to pause execution for a given number of milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//in here I initialize the fleet by fetching all active vehicles from the database and assigning them random starting positions and behaviour types (normal or one of the suspicious patterns)
const initializeFleet = async (vehicles) => {
  //here i fetch district details for all tuktuks to assign starting positions and behaviour patterns based on their districts
  const populatedVehicles = await Vehicle.find({ isActive: true })
    .populate('district', 'name')
    .select('_id district');

  const fleet = populatedVehicles.map((v, index) => {
    const districtName = v.district?.name || 'Colombo';
    const centre = DISTRICT_CENTERS[districtName] || DISTRICT_CENTERS['Colombo'];

  //here I assign suspicious behaviour to a percentage of the fleet based on the config ratio. The rest are normal vehicles
    const isSuspicious = index < Math.floor(populatedVehicles.length * CONFIG.SUSPICIOUS_RATIO);

    //each suspicious tuk tuk get assigned a specific anomaly pattern type
    const suspiciousPatterns = [
      'NIGHT_MOVEMENT',
      'SPEEDING',
      'BOUNDARY_CROSS',
      'STATIONARY',
      'ERRATIC',
    ];
    const patternType = isSuspicious
      ? suspiciousPatterns[index % suspiciousPatterns.length]
      : null;

    return {
      id: v._id,
      districtName,
      //start the tuk tuk at a random location within 0.1 degrees of the district centre
      lat: centre.lat + (Math.random() - 0.5) * 0.1,
      lng: centre.lng + (Math.random() - 0.5) * 0.1,

      homeLat: centre.lat,
      homeLng: centre.lng,
      isSuspicious,
      patternType,
      //track how many rounds a tuk tuk has been stationary for the stationary pattern
      stationaryRounds: 0,
    };
  });

  console.log(`Fleet initialized: ${fleet.length} vehicles`);
  console.log(`Normal:     ${fleet.filter(v => !v.isSuspicious).length} vehicles`);
  console.log(`Suspicious: ${fleet.filter(v => v.isSuspicious).length} vehicles`);
  console.log(`\n   Suspicious patterns assigned:`);
  ['NIGHT_MOVEMENT', 'SPEEDING', 'BOUNDARY_CROSS', 'STATIONARY', 'ERRATIC'].forEach(p => {
    const count = fleet.filter(v => v.patternType === p).length;
    console.log(`   → ${p}: ${count} vehicles`);
  });
  console.log('');

  return fleet;
};

//ping generator for normal behaviour tuktuks
const generateNormalPing = (vehicle, timestamp) => {
  const hour = timestamp.getHours();

  //normal tuk tuks do not operate during night hours so if it is night time, it retuns null
  if (hour < 6 || hour >= 21) {
    return null; 
  }

  vehicle.lat = nudge(vehicle.lat, CONFIG.NORMAL_MOVEMENT);
  vehicle.lng = nudge(vehicle.lng, CONFIG.NORMAL_MOVEMENT);

  return {
    vehicle: vehicle.id,
    latitude: parseFloat(vehicle.lat.toFixed(6)),
    longitude: parseFloat(vehicle.lng.toFixed(6)),
    speed: Math.floor(Math.random() * CONFIG.NORMAL_MAX_SPEED),
    heading: Math.floor(Math.random() * 360),
    accuracy: parseFloat((3 + Math.random() * 5).toFixed(1)),
    timestamp,
    anomaly: null,
    isAnomaly: false,
  };
};

//ping generator for suspicious tuktuks
const generateSuspiciousPing = (vehicle, timestamp) => {
  const hour = timestamp.getHours();

  switch (vehicle.patternType) {

    case 'NIGHT_MOVEMENT': {
      if (!isNightTime()) {
        return null;
      }
      //moving normally but at night hours
      vehicle.lat = nudge(vehicle.lat, CONFIG.NORMAL_MOVEMENT);
      vehicle.lng = nudge(vehicle.lng, CONFIG.NORMAL_MOVEMENT);

      return {
        vehicle: vehicle.id,
        latitude: parseFloat(vehicle.lat.toFixed(6)),
        longitude: parseFloat(vehicle.lng.toFixed(6)),
        speed: Math.floor(20 + Math.random() * 30), // slow at night
        heading: Math.floor(Math.random() * 360),
        accuracy: parseFloat((3 + Math.random() * 5).toFixed(1)),
        timestamp,
        anomaly: 'NIGHT_MOVEMENT',
        isAnomaly: true,
      };
    }
s
    case 'SPEEDING': {
      if (hour < 6 || hour >= 22) return null;

      vehicle.lat = nudge(vehicle.lat, CONFIG.NORMAL_MOVEMENT * 2);
      vehicle.lng = nudge(vehicle.lng, CONFIG.NORMAL_MOVEMENT * 2);

      return {
        vehicle: vehicle.id,
        latitude: parseFloat(vehicle.lat.toFixed(6)),
        longitude: parseFloat(vehicle.lng.toFixed(6)),
        speed: Math.floor(CONFIG.SPEEDING_MIN + Math.random() * (CONFIG.SPEEDING_MAX - CONFIG.SPEEDING_MIN)),
        heading: Math.floor(Math.random() * 360),
        accuracy: parseFloat((3 + Math.random() * 5).toFixed(1)),
        timestamp,
        anomaly: 'SPEEDING',
        isAnomaly: true,
      };
    }

    case 'BOUNDARY_CROSS': {
      if (hour < 6 || hour >= 21) return null;

      //move towards away from home district
      vehicle.lat = nudge(vehicle.lat, CONFIG.NORMAL_MOVEMENT * 3);
      vehicle.lng = nudge(vehicle.lng + 0.001, CONFIG.NORMAL_MOVEMENT * 3);
     //this 0.001 creates a bias in the movwment

      //here i check whether the tuk tuk has crossed the home district boundary
      //if its more than 0.3, then it is crossed)
      const latDiff = Math.abs(vehicle.lat - vehicle.homeLat);
      const lngDiff = Math.abs(vehicle.lng - vehicle.homeLng);
      const isCrossed = latDiff > 0.3 || lngDiff > 0.3;

      return {
        vehicle: vehicle.id,
        latitude: parseFloat(vehicle.lat.toFixed(6)),
        longitude: parseFloat(vehicle.lng.toFixed(6)),
        speed: Math.floor(Math.random() * 50),
        heading: Math.floor(Math.random() * 360),
        accuracy: parseFloat((3 + Math.random() * 5).toFixed(1)),
        timestamp,
        anomaly: isCrossed ? 'BOUNDARY_CROSS' : null,
        isAnomaly: isCrossed,
      };
    }

    case 'STATIONARY': {
      if (hour < 6 || hour >= 21) return null;

      //increment stationary rounds to track how long the vehicle has been stationary
      vehicle.stationaryRounds++;

      //tuktuk barely moves like 5 meters every round
      vehicle.lat = nudge(vehicle.lat, 0.00005);
      vehicle.lng = nudge(vehicle.lng, 0.00005);

      
      const isLongStationary = vehicle.stationaryRounds >= 3;

      return {
        vehicle: vehicle.id,
        latitude: parseFloat(vehicle.lat.toFixed(6)),
        longitude: parseFloat(vehicle.lng.toFixed(6)),
        speed: 0, //this confirms that the tuk tuk is stationary
        heading: 0,
        accuracy: parseFloat((3 + Math.random() * 5).toFixed(1)),
        timestamp,
        anomaly: isLongStationary ? 'STATIONARY' : null,
        isAnomaly: isLongStationary,
      };
    }

    case 'ERRATIC': {
      if (hour < 6 || hour >= 22) return null;

      //very abnormal zigzag movements
      vehicle.lat = nudge(vehicle.lat, CONFIG.ERRATIC_MOVEMENT);
      vehicle.lng = nudge(vehicle.lng, CONFIG.ERRATIC_MOVEMENT);

      //randomly decide to be either very slow or suddenly very fast to create an erratic pattern
      const speed = Math.random() > 0.5
        ? Math.floor(Math.random() * 15)       //very slow (0-15 km/h)
        : Math.floor(60 + Math.random() * 40); //suddenly speeding (60-100 km/h)

      return {
        vehicle: vehicle.id,
        latitude: parseFloat(vehicle.lat.toFixed(6)),
        longitude: parseFloat(vehicle.lng.toFixed(6)),
        speed,
        heading: Math.floor(Math.random() * 360), //random heading to add to the erratic pattern
        accuracy: parseFloat((3 + Math.random() * 5).toFixed(1)),
        timestamp,
        anomaly: 'ERRATIC',
        isAnomaly: true,
      };
    }

    default:
      return null;
  }
};

//this is the main simulation loop
const runSimulation = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n Live Simulation Engine Started');
  console.log('═══════════════════════════════════════');

  //load and initialize all active tuktuks
  const rawVehicles = await Vehicle.find({ isActive: true }).select('_id');

  if (rawVehicles.length === 0) {
    console.error('No vehicles found. Please run seed.js first.');
    process.exit(1);
  }

  //initialize the fleet with starting positions and behaviour patterns
  const fleet = await initializeFleet(rawVehicles);

  console.log('Generating pings every 10 seconds...');
  console.log('Press Ctrl+C to stop at any time.\n');

  let round = 1;

  //infinite loop to generate pings every 10 seconds
  while (true) {
    const timestamp = new Date();
    const roundPings = [];    
    const anomalyPings = [];  

    for (const vehicle of fleet) {
      //generate suitable ping baed on whether the tuk tuk is normal or suspicious
      const ping = vehicle.isSuspicious
        ? generateSuspiciousPing(vehicle, timestamp)
        : generateNormalPing(vehicle, timestamp);

      //null means tuk tuk is inactive or parked
      if (ping !== null) {
        roundPings.push(ping);
        if (ping.isAnomaly) {
          anomalyPings.push(ping);
        }
      }
    }
    if (roundPings.length > 0) {
      await LocationPing.insertMany(roundPings, { ordered: false });
    }

    //this si the terminal output
    const time = timestamp.toLocaleTimeString();
    const nightIndicator = isNightTime() ? '🌙' : '☀️';

    process.stdout.write(
      `\r${nightIndicator} Round ${String(round).padStart(4)} | ` +
      `Saved: ${String(roundPings.length).padStart(3)} pings | ` +
      `Anomalies: ${String(anomalyPings.length).padStart(2)} | ` +
      `Time: ${time} | Next in 10s...    `
    );

    round++;

    //wait 10s before next round
    await sleep(CONFIG.INTERVAL_MS);
  }
};

//stop the simulation
process.on('SIGINT', async () => {
  console.log('\n\n Simulation stopped gracefully.');
  console.log('All historical data is preserved in the database.');
  await mongoose.disconnect();
  process.exit(0);
});

//start the simulation and catch any unexpected errors to prevent crashes
runSimulation().catch(err => {
  console.error('Fatal simulation error:', err);
  process.exit(1);
});