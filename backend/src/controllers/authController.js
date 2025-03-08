import AuthService from "../services/authService.js";
import asyncHandler from "../utils/asyncHandler.js";

class AuthController {
  constructor(sqlInstance) {
    this.sqlInstance = sqlInstance;
  }

  async init() {
    this.authService = new AuthService(this.sqlInstance);
  }

  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const result = await this.authService.login(username, password);
    return res.json(result);
  });

  logout = asyncHandler(async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const { username } = req.body;

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    await this.authService.logout(username);
    return res.json({ message: "Logged out successfully" });
  });
}

export default AuthController;
