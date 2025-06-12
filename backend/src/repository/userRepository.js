import BaseSqlRepository from "./baseRepository/baseSqlRepository.js";

class UserRepository extends BaseSqlRepository {
  constructor() {
    super();
  }

  async findByUsername(username) {
    const users = await this.executeQuery(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return users.length ? users[0] : null;
  }

  async findById(id) {
    const users = await this.executeQuery("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    return users.length ? users[0] : null;
  }

  async updateUserToken(userId, token) {
    return this.executeQuery(
      "UPDATE users SET access_token = ?, last_login_time = NOW() WHERE id = ?",
      [token, userId]
    );
  }

  async logoutUser(username) {
    return this.executeQuery(
      "UPDATE users SET access_token = NULL WHERE username = ?",
      [username]
    );
  }

  async getUserByToken(token) {
    const users = await this.executeQuery(
      "SELECT * FROM users WHERE access_token = ?",
      [token]
    );
    return users.length ? users[0] : null;
  }
}

export default UserRepository;
