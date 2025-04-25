import { formatContextArray } from "../../core/utils/dataHandler.js";
import { customerDetailsRepository } from "../repository/customerDetailsRepository.js";

function init() {
  async function execute({ query, toolParams = {} }) {
    console.log("Query extracted through tool call:", query?.location);
    let customer;
    customer = await customerDetailsRepository.getCustomerByState(
      query?.location
    );
    if (customer.length === 0) {
      customer = await customerDetailsRepository.getCustomerByLocality(
        query?.location
      );
    }
    const formattedContext = formatContextArray(customer);

    console.log("🚀 ~ handleToolCalls ~ formattedContext:", formattedContext);

    return formattedContext;
  }

  return { execute };
}

export { init };
