import LocationPing from '../models/locationPing.js';
import Tuktuk from '../models/tuktuk.js';

//submit ping is the main endpoint where GPS devices send their location data
//only gps device has access to this endpoint
export const submitPing = async (req, res, next) => {
  try {
    let vehicleId;

    if (req.user.role === 'gps_device') {
      //secure mode: gps device sends pings with its own vehicleId (bound to its account)
      vehicleId = req.user.vehicle;
      if (!vehicleId) {
        return res.status(403).json({ success: false, message: 'This GPS device is not linked to any vehicle. Contact HQ Admin.' });
      }
    } else {
      vehicleId = req.body.vehicleId;
      if (!vehicleId) {
        return res.status(400).json({ success: false, message: 'vehicleId is required in the request body' });
      }
    }

    const ping = await LocationPing.create({
      vehicle: vehicleId,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      speed: req.body.speed,
      heading: req.body.heading,
      accuracy: req.body.accuracy
    });

    res.status(201).json({ success: true, data: ping });
  } catch (error) {
    next(error);
  }
};

//get latest location for a tuktuk by using the vehicle ID
export const getLatestLocation = async (req, res, next) => {
  try {
    const ping = await LocationPing.findOne({ vehicle: req.params.vehicleId })
      .sort('-timestamp')
      .populate('vehicle');

    if (!ping) return res.status(404).json({ success: false, message: 'No location data' });
    res.status(200).json({ success: true, data: ping });
  } catch (error) {
    next(error);
  }
};

//get location history for a tuktuk, with optional time range filtering
export const getHistory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { vehicle: req.params.vehicleId };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const history = await LocationPing.find(filter).sort('-timestamp').limit(100);
    res.status(200).json({ success: true, results: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

//get latest location for all tuktuks in a district (for station officers)
export const getDistrictLatest = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ district: req.params.districtId }).select('_id');
    const vehicleIds = vehicles.map(v => v._id);

    //aggregate query to get the latest ping for each vehicle in the district
    const latestPings = await LocationPing.aggregate([
      { $match: { vehicle: { $in: vehicleIds } } },
      { $sort: { vehicle: 1, timestamp: -1 } },
      { $group: { _id: '$vehicle', latestPing: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latestPing' } }
    ]);

    res.status(200).json({ success: true, count: latestPings.length, data: latestPings });
  } catch (error) {
    next(error);
  }
};


//get suspicious vehicles with their latest anomaly - for investigation purpose
export const getSuspiciousVehicles = async (req, res, next) => {
  try {

    ///this helps to filter only the anomalous pings
    const matchFilter = { isAnomaly: true };

    //can filter by anomaly type
    if (req.query.type) {
      const validTypes = ['NIGHT_MOVEMENT', 'SPEEDING', 'BOUNDARY_CROSS', 'STATIONARY', 'ERRATIC'];
      if (!validTypes.includes(req.query.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid anomaly type. Valid types: ${validTypes.join(', ')}`,
        });
      }
      matchFilter.anomaly = req.query.type;
    }

   //can filter by time range
    if (req.query.since) {
      matchFilter.timestamp = { $gte: new Date(req.query.since) };
    }

    //role based scoping: provincial officers see only their province, station officers see only their district
    let vehicleFilter = {};

    if (req.user.role === 'provincial_officer') {
      vehicleFilter.province = req.user.province;
    } else if (req.user.role === 'station_officer') {
      vehicleFilter.district = req.user.district;
    }

    //if role scoping is applied, we need to find the vehicles that fall under the scope first and then filter pings by those vehicle IDs
    if (Object.keys(vehicleFilter).length > 0) {
      const scopedVehicles = await Vehicle.find(vehicleFilter).select('_id');
      const scopedIds = scopedVehicles.map(v => v._id);
      matchFilter.vehicle = { $in: scopedIds };
    }

   //aggregate query to get the latest anomaly for each suspicious vehicle, along with vehicle and district details
    const suspiciousVehicles = await LocationPing.aggregate([

      //filter only anomalous pings
      { $match: matchFilter },

      //sorting by timestamp desc so that gives the lateset anomaly first when we group by vehicle
      { $sort: { timestamp: -1 } },

      //group by vehicle id
      {
        $group: {
          _id: '$vehicle',
          latestAnomalyType: { $first: '$anomaly' },

          //when did the latest anomaly happen
          lastSeenAt: { $first: '$timestamp' },
          //where was the vehicle when the latest anomaly happened    
          lastLatitude: { $first: '$latitude' },
          lastLongitude: { $first: '$longitude' },
          lastSpeed: { $first: '$speed' },
          totalAnomalyCount: { $sum: 1 },
          //collect all unique annomaly types for this tuk tuk
          anomalyTypes: { $addToSet: '$anomaly' },
        },
      },

      //join with Tuktuk collection to get vehicle details
      //lookup == left join in SQL
      {
        $lookup: {
          from: 'vehicles',          //mongodb collection name
          localField: '_id',         //field from the previous group stage (vehicle id)
          foreignField: '_id',       //field in the Vehicle collection to match with (vehicle id)
          as: 'vehicleDetails',      //output array name
        },
      },

      //unwind the vehicleDetails array to get an object
      { $unwind: '$vehicleDetails' },

      //join with District collection to get district details
      {
        $lookup: {
          from: 'districts',
          localField: 'vehicleDetails.district',
          foreignField: '_id',
          as: 'districtDetails',
        },
      },

      //unwind districtDetails array to get an object. 
      // preserveNullAndEmptyArrays: true means that if a vehicle doesn't have a district assigned,
      // it will still be included in the results with districtDetails as null
      {
        $unwind: {
          path: '$districtDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      //project only the fields that are needed for the investigator to quickly assess the situation
      {
        $project: {
          _id: 0, //hide the internal MongoDB id

         //vehicle details
          vehicleId: '$_id',
          registrationNumber: '$vehicleDetails.registrationNumber',
          vehicleStatus: '$vehicleDetails.status',
          vehicleColor: '$vehicleDetails.color',

          //district details
          assignedDistrict: '$districtDetails.name',

          //anomaly details
          latestAnomalyType: 1,
          anomalyTypes: 1,
          totalAnomalyCount: 1,

         //last known location and speed at the time of the latest anomaly
          lastSeenAt: 1,
          lastKnownLocation: {
            latitude: '$lastLatitude',
            longitude: '$lastLongitude',
          },
          lastSpeed: 1,

          //severity score measures how many different types of anomalies this tuktuk has triggered
          //more anomaly types = high severity = more suspicious
          severityScore: { $size: '$anomalyTypes' },
        },
      },

     //sort to appear the most suspicoius tuktuks in the top
      { $sort: { severityScore: -1, lastSeenAt: -1 } },
    ]);

    //summary of how many suspicious vehicles found by anomaly type
    const anomalySummary = {
      NIGHT_MOVEMENT: 0,
      SPEEDING: 0,
      BOUNDARY_CROSS: 0,
      STATIONARY: 0,
      ERRATIC: 0,
    };

    suspiciousVehicles.forEach(vehicle => {
      vehicle.anomalyTypes.forEach(type => {
        if (anomalySummary[type] !== undefined) {
          anomalySummary[type]++;
        }
      });
    });

    //response
    res.status(200).json({
      success: true,
      totalSuspiciousVehicles: suspiciousVehicles.length,
      anomalySummary,
      filters: {
        type: req.query.type || 'all',
        since: req.query.since || 'all time',
        scope: req.user.role,
      },

     //the list of suspicious vehicles with their latest anomaly and details
      data: suspiciousVehicles,
    });

  } catch (error) {
    next(error);
  }
};
