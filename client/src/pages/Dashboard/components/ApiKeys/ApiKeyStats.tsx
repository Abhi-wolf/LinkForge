import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKey, ApiKeyStatus } from "@/types/apiKey.types";

interface ApiKeyStatsProps {
  apiKeys: ApiKey[];
}

export function ApiKeyStats({ apiKeys }: ApiKeyStatsProps) {
  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter((key) => key.apiKeyStatus === ApiKeyStatus.ACTIVE).length;
  const inactiveKeys = totalKeys - activeKeys;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalKeys}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {activeKeys}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Inactive Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {inactiveKeys}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
