import ApiError from "../utils/api-error.js";

export const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    const isApiRequest = req.headers["content-type"]?.includes("application/json")
      || req.headers["accept"]?.includes("application/json");

    if (isApiRequest) {
      return next(ApiError.unauthorized("Login required"));
    }

    return res.redirect(`/ui/login.html?next=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};