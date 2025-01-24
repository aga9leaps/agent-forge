import GeneralAgent from "./agents/generalAgent.js";
import ReportingAgent from "./agents/reportingAgent.js";

class AgentFactory {
  constructor(sqlInstance) {
    this.sqlInstance = sqlInstance;
  }
  static createAgent(agentType) {
    switch (agentType) {
      case "GeneralAgent":
        return new GeneralAgent();
      case "GENERAL" || "FINANCIAL" || "OPERATIONAL" || "TEAM":
        return new ReportingAgent();
      case "CustomerInteractionAgent":
        return new CustomerInteractionAgent(sqlInstance);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }
}

export default AgentFactory;
