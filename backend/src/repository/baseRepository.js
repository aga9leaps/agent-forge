class BaseRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async withConnection(callback) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      return await callback(connection);
    } finally {
      if (connection) {
        try {
          console.log("Connection Released");
          connection.release();
        } catch (releaseError) {
          console.error("Error releasing connection: ", releaseError);
        }
      }
    }
  }

  async executeQuery(query, params = []) {
    const sanitizedParams = params.map((param) =>
      param === undefined ? null : param
    );
    return this.withConnection(async (connection) => {
      const [results] = await connection.execute(query, sanitizedParams);
      return results;
    });
  }

  async closeConnection() {
    try {
      await this.pool.end();
      console.log("MySQL pool closed");
    } catch (error) {
      console.error("Error closing MySQL pool: ", error);
    }
  }
}

export default BaseRepository;
