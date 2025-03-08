import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserRepository from "../repository/userRepository.js";
import config from "../config/config.js";

class AuthService {
  constructor(sqlInstance) {
    this.sqlInstance = sqlInstance;
  }

  async login(username, password) {
    const userRepository = new UserRepository(this.sqlInstance);
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { id: user[0].id, username: user[0].username },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRATION_TIME }
    );

    await userRepository.updateUserToken(user[0].id, token);
    return {
      token,
      username: user[0].username,
      name: user[0].name,
      role: user[0].role,
    };
  }

  async logout(username) {
    const userRepository = new UserRepository(this.sqlInstance);
    const response = await userRepository.logoutUser(username);
    return response;
  }

  async getUserByToken(token) {
    const userRepository = new UserRepository(this.sqlInstance);
    const response = await userRepository.getUserByToken(token);
    return response;
  }
}

export default AuthService;
