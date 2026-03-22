import { router } from "./context";
import { apiKeyController } from "../../controllers/apiKey.controller";

export const apiKeyRouter = router({
  createApiKey: apiKeyController.createApiKey,
  getApiKeys: apiKeyController.getApiKeys,
  updateStatus: apiKeyController.updateStatus,
  deleteApiKey: apiKeyController.deleteApiKey,
  verifyApiKey: apiKeyController.verifyApiKey,
});
