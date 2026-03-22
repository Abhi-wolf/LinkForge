import { Key, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiKey, ApiKeyStatus } from "@/types/apiKey.types";
import { ApiKeyItem } from "./ApiKeyItem";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  showApiKey: string | null;
  setShowApiKey: (id: string | null) => void;
  refetch: () => void;
  copyToClipboard: (text: string) => void;
  confirmStatusUpdate: (id: string, status: ApiKeyStatus) => void;
  setDeleteId: (id: string | null) => void;
  onCreateKey: () => void;
}

export function ApiKeyList({
  apiKeys,
  showApiKey,
  setShowApiKey,
  refetch,
  copyToClipboard,
  confirmStatusUpdate,
  setDeleteId,
  onCreateKey,
}: ApiKeyListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your API Keys</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          These keys provide full access to your account. Keep them secure and
          never share publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No API keys found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first API key to enable programmatic access to your
              URL shortener service.
            </p>
            <Button onClick={onCreateKey} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <ApiKeyItem
                key={apiKey.id}
                apiKey={apiKey}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                copyToClipboard={copyToClipboard}
                confirmStatusUpdate={confirmStatusUpdate}
                setDeleteId={setDeleteId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
