import BaseSqlRepository from "../../core/baseRepository/baseSqlRepository.js";

class CustomerDetailsRepository extends BaseSqlRepository {
  async getCustomerByState(state) {
    if (!state) return [];

    // Fuzzy search query to match state names with minor errors
    const query = `SELECT Particulars FROM SalesDetails WHERE state LIKE ?`;
    return await this.executeQuery(query, [`%${state}%`]);
  }

  async getCustomerByLocality(locality) {
    if (!locality) return [];

    // Fuzzy search query to match locality names with minor errors
    const query = `SELECT Particulars FROM SalesDetails WHERE LOWER(Buyer_Address) LIKE ?`;
    return await this.executeQuery(query, [`%${locality}%`]);
  }

  // GST-State Mapping Function
  //   getStateNameFromGST(gstNumber) {
  //     if (!gstNumber || gstNumber.length < 2) return null;
  //     const stateCode = gstNumber.substring(0, 2);
  //     const stateMapping = {
  //       "01": "JAMMU AND KASHMIR",
  //       "02": "HIMACHAL PRADESH",
  //       "03": "PUNJAB",
  //       "04": "CHANDIGARH",
  //       "05": "UTTARAKHAND",
  //       "06": "HARYANA",
  //       "07": "DELHI",
  //       "08": "RAJASTHAN",
  //       "09": "UTTAR PRADESH",
  //       10: "BIHAR",
  //       11: "SIKKIM",
  //       12: "ARUNACHAL PRADESH",
  //       13: "NAGALAND",
  //       14: "MANIPUR",
  //       15: "MIZORAM",
  //       16: "TRIPURA",
  //       17: "MEGHALAYA",
  //       18: "ASSAM",
  //       19: "WEST BENGAL",
  //       20: "JHARKHAND",
  //       21: "ODISHA",
  //       22: "CHATTISGARH",
  //       23: "MADHYA PRADESH",
  //       24: "GUJARAT",
  //       26: "DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
  //       27: "MAHARASHTRA",
  //       28: "ANDHRA PRADESH",
  //       29: "KARNATAKA",
  //       30: "GOA",
  //       31: "LAKSHADWEEP",
  //       32: "KERALA",
  //       33: "TAMIL NADU",
  //       34: "PUDUCHERRY",
  //       35: "ANDAMAN AND NICOBAR ISLANDS",
  //       36: "TELANGANA",
  //       37: "ANDHRA PRADESH",
  //       38: "LADAKH",
  //       97: "OTHER TERRITORY",
  //       99: "CENTRE JURISDICTION",
  //     };
  //     return stateMapping[stateCode] || null;
  //   }
}

export const customerDetailsRepository = new CustomerDetailsRepository();
