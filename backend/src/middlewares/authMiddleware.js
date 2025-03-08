import jwt from "jsonwebtoken";
import config from "../config/config.js";
import UserRepository from "../repository/userRepository.js";
import asyncHandler from "../utils/asyncHandler.js";

const authenticateToken = (sqlInstance) =>
  asyncHandler(async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const userRepository = new UserRepository(sqlInstance);
    const user = await userRepository.findById(decoded.id);

    if (!user || user[0].access_token !== token) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  });

export { authenticateToken };
