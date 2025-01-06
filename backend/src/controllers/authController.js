class AuthController {
  constructor(sqlInstance) {
    this.sqlInstance = sqlInstance;
  }
  async init() {
    this.authService = new AuthService(this.sqlInstance);
  }
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const result = await this.authService.login(username, password);
      return res.json(result);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      const { username } = req.body;

      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      await this.authService.logout(username);
      return res.json({ message: "Logged out successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default AuthController;
