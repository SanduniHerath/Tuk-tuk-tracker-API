import { Province, District, PoliceStation } from '../models/index.js';

/**
 * @desc    Get all Provinces in Sri Lanka
 * @route   GET /api/v1/master/provinces
 * @access  Private (All Officers)
 */
export const getProvinces = async (req, res, next) => {
  try {
    //find all provinces by sorting them alphabetically
    const data = await Province.find().sort('name');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Districts (with optional province filtering)
 * @route   GET /api/v1/master/districts
 * @access  Private (All Officers)
 */
export const getDistricts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.province) filter.province = req.query.province;//filtering by province ID

    //in here I use .populate() to automatically fetch the parent Province details
    const data = await District.find(filter).populate('province').sort('name');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new Province (Admin setup)
 * @route   POST /api/v1/master/provinces
 * @access  Private to hq admin only
 */
export const createProvince = async (req, res, next) => {
  try {
    const data = await Province.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new District (Admin setup)
 * @route   POST /api/v1/master/districts
 * @access  Private to hq admin only
 */
export const createDistrict = async (req, res, next) => {
  try {
    const data = await District.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
