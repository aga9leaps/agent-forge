import BaseRepository from "./baseRepository.js";

class UserRepository extends BaseRepository {
  async findByUsername(username) {
    return this.executeQuery("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
  }

  async findById(id) {
    return this.executeQuery("SELECT * FROM users WHERE id = ?", [id]);
  }

  async updateUserToken(userId, token) {
    return this.executeQuery(
      "UPDATE users SET access_token = ?, last_login_time = NOW() WHERE id = ?",
      [token, userId]
    );
  }

  async removeUserToken(username) {
    return this.executeQuery(
      "UPDATE users SET access_token = NULL WHERE username = ?",
      [username]
    );
  }

  async logoutUser(username) {
    return this.executeQuery(
      "UPDATE users SET access_token = NULL WHERE username = ?",
      [username]
    );
  }

  async getUserByToken(token) {
    return this.executeQuery("SELECT * FROM users WHERE access_token = ?", [
      token,
    ]);
  }
}

export default UserRepository;
