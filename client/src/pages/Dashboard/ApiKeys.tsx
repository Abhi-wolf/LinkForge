import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApiKeys,
  useCreateApiKey,
  useUpdateApiKeyStatus,
  useDeleteApiKey,
} from "@/hooks/useApiKeys";
import { ApiKeyStatus } from "@/types/apiKey.types";

// Sub-components
import { ApiKeyHeader } from "./components/ApiKeys/ApiKeyHeader";
import { ApiKeyStats } from "./components/ApiKeys/ApiKeyStats";
import { ApiKeyList } from "./components/ApiKeys/ApiKeyList";
import { ApiKeyDialogs } from "./components/ApiKeys/ApiKeyDialogs";
import { ApiKey } from "@/types/apiKey.types";

export default function ApiKeys() {
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ApiKeyStatus | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: apiKeys = [], isLoading, refetch } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const updateApiKeyStatus = useUpdateApiKeyStatus();
  const deleteApiKey = useDeleteApiKey();

  const handleStatusUpdate = async (id: string, status: ApiKeyStatus) => {
    try {
      await updateApiKeyStatus.mutateAsync({ id, status });
      toast.success(
        `API key ${status === ApiKeyStatus.ACTIVE ? "activated" : status === ApiKeyStatus.INACTIVE ? "deactivated" : "revoked"} successfully`,
      );
      setStatusUpdateId(null);
      setNewStatus(null);
    } catch (error) {
      toast.error("Failed to update API key status");
    }
  };

  const handleDeleteApiKey = async () => {
    if (!deleteId) return;

    try {
      await deleteApiKey.mutateAsync({ id: deleteId });
      toast.success("API key deleted successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const confirmStatusUpdate = (id: string, status: ApiKeyStatus) => {
    setStatusUpdateId(id);
    setNewStatus(status);
  };

  const handleCreateApiKey = async (description?: string) => {
    try {
      const data = await createApiKey.mutateAsync({ description });
      toast.success("API key created successfully");
      setNewApiKey(data.apiKey);
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard");
  };



  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <ApiKeyHeader
        onCreateKey={() => setIsCreateDialogOpen(true)}
        isPending={createApiKey.isPending}
      />

      <ApiKeyStats apiKeys={apiKeys as ApiKey[]} />

      <ApiKeyList
        apiKeys={apiKeys as ApiKey[]}
        refetch={refetch}
        confirmStatusUpdate={confirmStatusUpdate}
        setDeleteId={setDeleteId}
        onCreateKey={() => setIsCreateDialogOpen(true)}
      />

      <ApiKeyDialogs
        newApiKey={newApiKey}
        setNewApiKey={setNewApiKey}
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        onCreateKey={handleCreateApiKey}
        isCreating={createApiKey.isPending}
        statusUpdateId={statusUpdateId}
        setStatusUpdateId={setStatusUpdateId}
        newStatus={newStatus}
        handleStatusUpdate={handleStatusUpdate}
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        handleDeleteApiKey={handleDeleteApiKey}
        copyToClipboard={copyToClipboard}
      />
    </div>
  );
}
