import ClientSchemaService from "./ClientSchemaService.js";

class ConfigLoader {
  static config = null;

  static async loadClientConfig(clientId) {
    if (!this.config) {
      this.config = await ClientSchemaService.getConfig(clientId);
    }
    return this.config;
  }

  static getConfig() {
    if (!this.config) {
      throw new Error(
        "Configuration not loaded. Call `loadClientConfig` first."
      );
    }
    return this.config;
  }
}

export default ConfigLoader;
