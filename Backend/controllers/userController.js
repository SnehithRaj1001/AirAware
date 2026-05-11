import { getUserDashboardData, getUserTrends } from "../services/userDashboardService.js";

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await getUserDashboardData(userId);
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
