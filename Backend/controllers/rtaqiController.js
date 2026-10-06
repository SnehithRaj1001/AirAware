import { getLatestReading, getReadingHistory } from "../services/iotSensorService.js";

export const getLatestIotData = async (req, res, next) => {
  try {
    const { deviceId } = req.query;
    const reading = await getLatestReading(deviceId || null);

    if (!reading) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No sensor readings recorded yet. Ensure Raspberry Pi script is running and sending data.",
      });
    }

    return res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

export const getIotHistory = async (req, res, next) => {
  try {
    const { deviceId, limit } = req.query;
    const history = await getReadingHistory({ deviceId: deviceId || null, limit });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
