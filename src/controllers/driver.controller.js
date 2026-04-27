import { Driver } from '../models/index.js';
import ApiFeatures from '../utils/apiFeatures.js';

//get all drivers with filtering, sorting, field limiting and pagination
export const getDrivers = async (req, res, next) => {
  try {

    //convert district 7 province names into their corrosponding object IDs for filtering
    if (req.query.district && isNaN(req.query.district)) {
      const district = await District.findOne({
        name: { $regex: `^${req.query.district}$`, $options: 'i' }//case insensitive
      });

      if (!district) {
        return res.status(404).json({
          success: false,
          message: 'District not found',
        });
      }

      req.query.district = district._id;
    }

    if (req.query.province && isNaN(req.query.province)) {
      const province = await Province.findOne({
        name: { $regex: `^${req.query.province}$`, $options: 'i' }
      });

      if (!province) {
        return res.status(404).json({
          success: false,
          message: 'Province not found',
        });
      }

      req.query.province = province._id;
    }


    //in here, I apply all the API features to the query
    //I populate the query with district and province to show full territorial details
    const features = new ApiFeatures(Driver.find().populate('district province'), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

   //execute the query
    const data = await features.query;

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

//get a single driver by nic number
export const getDriver = async (req, res, next) => {
  try {
    const data = await Driver.findOne({ nic: req.params.nic }).populate('district province');

    if (!data) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//register a new tuktuk driver
export const createDriver = async (req, res, next) => {
  try {
    const { district, province } = req.body;

    //convert district name to its objectid
    let districtDoc = null;
    if (district && isNaN(district)) {
      districtDoc = await District.findOne({
        name: { $regex: `^${district}$`, $options: 'i' }
      });

      if (!districtDoc) {
        return res.status(404).json({
          success: false,
          message: 'District not found'
        });
      }

      req.body.district = districtDoc._id;
    }

    //convert province name to its objectid
    let provinceDoc = null;
    if (province && isNaN(province)) {
      provinceDoc = await Province.findOne({
        name: { $regex: `^${province}$`, $options: 'i' }
      });

      if (!provinceDoc) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      req.body.province = provinceDoc._id;
    }

    //create the driver
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

//update a driver by nic number
export const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndUpdate({ nic: req.params.nic }, req.body, {
      new: true,
      runValidators: true
    });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//delete a driver by nic number
export const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndDelete({ nic: req.params.nic });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};
