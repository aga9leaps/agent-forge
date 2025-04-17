class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  async loadClientTools(clientConfig) {
    for (const [toolName, toolConfig] of Object.entries(clientConfig.tools)) {
      if (!toolConfig.enabled) continue;

      try {
        const { init } = await import(toolConfig.module);
        this.tools.set(toolName, init());
      } catch (error) {
        console.error(`Failed to load ${toolName}:`, error);
      }
    }
  }

  getTool(toolName) {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);
    return tool;
  }
}

export default ToolRegistry;
