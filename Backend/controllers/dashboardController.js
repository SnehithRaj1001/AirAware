import { getDashboardSummaryData } from "../services/dashboardService.js";

export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await getDashboardSummaryData();
    res.json({ summary });
  } catch (error) {
    next(error);
  }
};
