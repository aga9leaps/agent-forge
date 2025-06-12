import AuthService from "../services/authService.js";

class AuthController {
   constructor() {
    this.authService = new AuthService();
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      const { username } = req.body;
      await this.authService.logout(username);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default AuthController;