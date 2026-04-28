import { Province, District, PoliceStation } from '../models/index.js';

//to get all provinces
export const getProvinces = async (req, res, next) => {
  try {
    //find all provinces by sorting them alphabetically
    const data = await Province.find().sort('name');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

//get a province details by using name
export const getProvince = async (req, res, next) => {
  try {
    const data = await Province.findOne({ name: req.params.name });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//update a province by using name
export const updateProvince = async (req, res, next) => {
  try {
    const data = await Province.findOneAndUpdate(
      { name: req.params.name },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//delete a province by using name
export const deleteProvince = async (req, res, next) => {
  try {
    const data = await Province.findOneAndDelete(
      { name: req.params.name },
      { new: true, runValidators: true }
    );
    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

//get all districts details
export const getDistricts = async (req, res, next) => {
  try {
    const filter = {};

    //convert province name to object id
    if (req.query.province) {
      const provinceDoc = await Province.findOne({
        name: { $regex: `^${req.query.province}$`, $options: 'i' }
      });

      if (!provinceDoc) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      filter.province = provinceDoc._id;
    }

    const data = await District
      .find(filter)
      .populate('province');

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });

  } catch (error) {
    next(error);
  }
};

//get a distric details by using name
export const getDistrict = async (req, res, next) => {
  try {
    const data = await District.findOne({ name: req.params.name }).populate('province');
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

//update district by using name
export const updateDistrict = async (req, res, next) => {
  try {
    let updateData = { ...req.body };

    //convert province name to object id
    if (req.body.province) {
      const provinceDoc = await Province.findOne({ name: req.body.province });

      if (!provinceDoc) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      updateData.province = provinceDoc._id;
    }

    const data = await District.findOneAndUpdate(
      { name: req.params.name },
      updateData,
      { new: true, runValidators: true }
    ).populate('province');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    res.status(200).json({ success: true, data });

  } catch (error) {
    next(error);
  }
};

//delete district by using name
export const deleteDistrict = async (req, res, next) => {
  try {
    const data = await District.findOneAndDelete(
      { name: req.params.name },
      { new: true, runValidators: true }
    );
    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

//get all police stations details
export const getStations = async (req, res, next) => {
  try {
    const filter = {};

    //convert district name to object id
    if (req.query.district) {
      const districtDoc = await District.findOne({
        name: req.query.district
      });

      if (!districtDoc) {
        return res.status(404).json({
          success: false,
          message: 'District not found'
        });
      }

      filter.district = districtDoc._id;
    }

    //convert province name to object id
    if (req.query.province) {
      const provinceDoc = await Province.findOne({
        name: req.query.province
      });

      if (!provinceDoc) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      filter.province = provinceDoc._id;
    }

    const data = await Station
      .find(filter)
      .populate('district province');

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });

  } catch (error) {
    next(error);
  }
};

//get a police station details by using station code
export const getStation = async (req, res, next) => {
  try {
    const data = await Station.findOne({ stationCode: req.params.code }).populate('district province');
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};


//create a new police station
export const createStation = async (req, res, next) => {
  try {
    const { district, province, ...rest } = req.body;

    //find district name
    const districtDoc = await District.findOne({
      name: { $regex: `^${district}$`, $options: 'i' }
    });

    if (!districtDoc) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    //find province name
    const provinceDoc = await Province.findOne({
      name: { $regex: `^${province}$`, $options: 'i' }
    });

    if (!provinceDoc) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }

    //validate the district belongs to the province
    if (districtDoc.province.toString() !== provinceDoc._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'District does not belong to the given province'
      });
    }

    //create station
    const data = await Station.create({
      ...rest,
      district: districtDoc._id,
      province: provinceDoc._id
    });

    res.status(201).json({
      success: true,
      data
    });

  } catch (error) {
    next(error);
  }
};


//update a police station by using station code
export const updateStation = async (req, res, next) => {
  try {
    const data = await Station.findOneAndUpdate(
      { stationCode: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};


//delete a police station by using station code
export const deleteStation = async (req, res, next) => {
  try {
    const data = await Station.findOneAndDelete(
      { stationCode: req.params.code },
      { new: true, runValidators: true }
    );
    res.status(204).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};
