import { Driver } from '../models/index.js';
import ApiFeatures from '../utils/apiFeatures.js';

/**
 * @desc    Get all drivers with using advanced search techniques like filtering, sorting, field limiting and pagination
 * @route   GET /api/v1/drivers
 * @access  Private
 */

export const getDrivers = async (req, res, next) => {
  try {
    //in here, I build the query using ApiFeatures class
    //I populate the query with district and province to show full territorial details
    const features = new ApiFeatures(Driver.find().populate('district province'), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //in here, I execute the query
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

/**
 * @desc    Get single driver details by using ID
 * @route   GET /api/v1/drivers/:id
 * @access  Private
 */

export const getDriver = async (req, res, next) => {
  try {
    const data = await Driver.findById(req.params.id).populate('district province');

    if (!data) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new Driver
 * @route   POST /api/v1/drivers
 * @access  Private to hq_admin, provincial_officer, station_officer
 */

export const createDriver = async (req, res, next) => {
  try {
    const data = await Driver.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Driver details
 * @route   PATCH /api/v1/drivers/:id
 * @access  Private
 */
export const updateDriver = async (req, res, next) => {
  try {
    const data = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!data) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Driver
 * @route   DELETE /api/v1/drivers/:id
 * @access  Private - hq_admin only
 */

export const deleteDriver = async (req, res, next) => {
  try {
    const data = await Driver.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};
