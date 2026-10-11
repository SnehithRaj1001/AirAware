import { getUserDashboardData, getUserTrends, getUserHealthAdvisory } from "../services/userDashboardService.js";

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await getUserDashboardData(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getHealthAdvisory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stationId = req.query.stationId ? parseInt(req.query.stationId, 10) : null;
    const data = await getUserHealthAdvisory(userId, stationId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await getUserTrends(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

