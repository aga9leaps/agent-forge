import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserRepository from "../repository/userRepository.js";

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new Error("Invalid credentials");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME }
    );

    await this.userRepository.updateUserToken(user.id, token);
    return {
      token,
      username: user.username,
      name: user.name,
      role: user.role,
    };
  }

  async logout(username) {
    return await this.userRepository.logoutUser(username);
  }

  async getUserByToken(token) {
    return await this.userRepository.getUserByToken(token);
  }
}

export default AuthService;