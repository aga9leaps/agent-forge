import { vectorSearchTool } from "./vectorSearchTool.js";

export async function toolSelector(toolName, params) {
  switch (toolName) {
    case "vectorSearch":
      return await vectorSearchTool(params.query);

    default:
      console.log(`Tool ${toolName} is not implemented`);
      break;
  }
}
