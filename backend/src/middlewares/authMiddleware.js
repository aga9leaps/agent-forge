import jwt from "jsonwebtoken";
import config from "../config/config.js";
import UserRepository from "../repository/userRepository.js";

const authenticateToken = (sqlInstance) => async (req, res, next) => {
  try {
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
  } catch (error) {
    console.log("Error in middleware");

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { authenticateToken };
