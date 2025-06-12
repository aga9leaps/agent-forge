import jwt from "jsonwebtoken";
import UserRepository from "../repository/userRepository.js";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.id);

    if (!user || user.access_token !== token) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Role-based middleware
const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

export { authenticateToken, authorizeRoles };
