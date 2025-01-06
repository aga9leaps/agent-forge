import database from "../config/database.js";
import GeneralAgent from "./agents/generalAgent.js";
import ReportingAgent from "./agents/reportingAgent.js";

class AgentFactory {
  static createAgent(agentType) {
    switch (agentType) {
      case "GeneralAgent":
        return new GeneralAgent(database);
      case "ReportingAgent":
        return new ReportingAgent(database);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }
}

export default AgentFactory;
