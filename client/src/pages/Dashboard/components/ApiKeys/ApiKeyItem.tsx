import { Ban, CheckCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiKey, ApiKeyStatus } from "@/types/apiKey.types";

interface ApiKeyItemProps {
  apiKey: ApiKey;
  confirmStatusUpdate: (id: string, status: ApiKeyStatus) => void;
  setDeleteId: (id: string | null) => void;
}

export function ApiKeyItem({
  apiKey,
  confirmStatusUpdate,
  setDeleteId,
}: ApiKeyItemProps) {
  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.substring(0, 8) + "••••••••••••••••••";
  };

  const apiKeyId = apiKey.id || (apiKey as any)._id;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm bg-muted px-3 py-1 rounded">
            {maskApiKey(apiKey.apiKey)}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge
            variant={
              apiKey.apiKeyStatus === ApiKeyStatus.ACTIVE
                ? "default"
                : "secondary"
            }
            className={
              apiKey.apiKeyStatus === ApiKeyStatus.ACTIVE
                ? "bg-green-500 hover:bg-green-600 text-white border-none"
                : "bg-gray-100 text-gray-800 border-gray-200"
            }
          >
            {apiKey.apiKeyStatus.charAt(0).toUpperCase() +
              apiKey.apiKeyStatus.slice(1)}
          </Badge>
          {apiKey.description && (
            <span className="font-medium text-foreground">
              {apiKey.description}
            </span>
          )}
          <span>
            Created on : {new Date(apiKey.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {apiKey.apiKeyStatus === ApiKeyStatus.ACTIVE && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    confirmStatusUpdate(apiKeyId, ApiKeyStatus.INACTIVE)
                  }
                  className="text-orange-600 focus:text-orange-700"
                >
                  <Ban className="h-3 w-3 mr-2" />
                  Deactivate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    confirmStatusUpdate(apiKeyId, ApiKeyStatus.REVOKED)
                  }
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Revoke
                </DropdownMenuItem>
              </>
            )}
            {apiKey.apiKeyStatus === ApiKeyStatus.INACTIVE && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    confirmStatusUpdate(apiKeyId, ApiKeyStatus.ACTIVE)
                  }
                  className="text-green-600 focus:text-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Activate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteId(apiKeyId)}
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </>
            )}
            {apiKey.apiKeyStatus === ApiKeyStatus.REVOKED && (
              <DropdownMenuItem
                onClick={() => setDeleteId(apiKeyId)}
                className="text-red-600 focus:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Permanently
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
