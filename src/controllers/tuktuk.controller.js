import { Tuktuk } from '../models/index.js';
import ApiFeatures from '../utils/apiFeatures.js';

/**
 * @desc    Get all tuk-tuks with using advanced search techniques like filtering, sorting, field limiting and pagination
 * @route   GET /api/v1/tuktuks
 * @access  Private
 */

export const getTuktuks = async (req, res, next) => {
  try {
    //in here, I build the query using ApiFeatures class
    //I populate the query with driver, district and province to show full territorial details
    const features = new ApiFeatures(Tuktuk.find().populate('driver district province'), req.query)
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
 * @desc    Get single tuk-tuk details by using ID
 * @route   GET /api/v1/tuktuks/:id
 * @access  Private
 */

export const getTuktuk = async (req, res, next) => {
  try {
    const data = await Tuktuk.findById(req.params.id).populate('driver district province');

    if (!data) {
      return res.status(404).json({ success: false, message: 'Tuk-Tuk not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new Tuk-Tuk
 * @route   POST /api/v1/tuktuks
 * @access  Private to hq_admin, provincial_officer, station_officer
 */

export const createTuktuk = async (req, res, next) => {
  try {
    const data = await Tuktuk.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Tuk-Tuk details
 * @route   PATCH /api/v1/tuktuks/:id
 * @access  Private
 */

export const updateTuktuk = async (req, res, next) => {
  try {
    const data = await Tuktuk.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!data) {
      return res.status(404).json({ success: false, message: 'Tuk-Tuk not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Tuk-Tuk
 * @route   DELETE /api/v1/tuktuks/:id
 * @access  Private - hq_admin only
 */

export const deleteTuktuk = async (req, res, next) => {
  try {
    const data = await Tuktuk.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({ success: false, message: 'Tuk-Tuk not found' });
    }

    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};
