import { Tuktuk } from '../models/index.js';
import ApiFeatures from '../utils/apiFeatures.js';

//get all tuk tuk vehicles with filtering, sorting, field limiting and pagination
export const getTuktuks = async (req, res, next) => {
  try {

    //role based filtering
    if (req.user.role === 'provincial_officer') {
      req.query.province = req.user.province;
    } else if (req.user.role === 'station_officer') {
      req.query.district = req.user.district;
    }

    //here, i convert my district and province names into their corrosponding object IDs
    //handle district name
    if (req.query.district && isNaN(req.query.district)) {
      const district = await District.findOne({
        name: { $regex: `^${req.query.district}$`, $options: 'i' } // case-insensitive
      });

      if (!district) {
        return res.status(404).json({
          success: false,
          message: 'District not found',
        });
      }

      req.query.district = district._id;
    }

    //handle province name
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
    //I populate the query with driver, district and province to show full territorial details
    const features = new ApiFeatures(Tuktuk.find().populate('driver district province'), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //in here, I execute the query
    const tuktuks = await features.query;

    //response
    res.status(200).json({
      success: true,
      results: tuktuks.length,
      data: tuktuks
    });
  } catch (error) {
    next(error);
  }
};

//get a single tuk tuk by registration number
export const getTuktuk = async (req, res, next) => {
  try {
    const tuktuk = await Tuktuk.findOne({ registrationNumber: req.params.regNo }).populate('driver district province');

    if (!tuktuk) {
      return res.status(404).json({ success: false, message: 'Tuk-Tuk not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//create a new tuk tuk
export const createTuktuk = async (req, res, next) => {
  try {
    const tuktuk = await Tuktuk.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//update a tuk tuk by registration number
export const updateTuktuk = async (req, res, next) => {
  try {
    const tuktuk = await Tuktuk.findOneAndUpdate({ registrationNumber: req.params.regNo }, req.body, {
      new: true,
      runValidators: true
    }).populate('driver district province');

    if (!tuktuk) {
      return res.status(404).json({ success: false, message: 'Tuk-Tuk not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//delete a tuk tuk by registration number
export const deleteTuktuk = async (req, res, next) => {
  try {
    const tuktuk = await Tuktuk.findOneAndDelete({ registrationNumber: req.params.regNo });

    if (!tuktuk) {
      return res.status(404).json({ success: false, message: 'Tuk-Tuk not found' });
    }

    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};
