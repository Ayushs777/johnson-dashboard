import api from "./api";

export const nocRequestService = {
  submit: async (request) => {
    const response = await api.post("/noc-requests", request);
    return response.data;
  },
};
