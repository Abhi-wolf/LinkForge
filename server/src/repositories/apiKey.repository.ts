import ApiKey, { ApiKeyStatus, IApiKey } from "../models/apiKey.model";

export class ApiKeyRepository {
  async create(data: Partial<IApiKey>): Promise<IApiKey> {
    return await ApiKey.create(data);
  }

  async findApiKeysOfUser(userId: string): Promise<IApiKey[]> {
    return await ApiKey.find({ userId }).populate({
      path: "userId",
      select: "_id name email"
    });
  }

  async findApiKey(apiKey: string): Promise<IApiKey | null> {
    return await ApiKey.findOne({ apiKey, apiKeyStatus: ApiKeyStatus.ACTIVE });
  }

  async findApiKeyById(id: string): Promise<IApiKey | null> {
    return await ApiKey.findOne({ _id: id }).populate({
      path: "userId",
      select: "_id name email"
    });
  }

  async updateApiKeyStatus(id: string, status: string): Promise<IApiKey | null> {
    return await ApiKey.findOneAndUpdate(
      { _id: id },
      { apiKeyStatus: status },
      { new: true }
    );
  }

  async deleteApiKey(id: string): Promise<void> {
    await ApiKey.deleteOne({ _id: id });
  }
}
