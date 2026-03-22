import { AlertTriangle, Copy, Shield, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiKeyStatus } from "@/types/apiKey.types";

interface ApiKeyDialogsProps {
  newApiKey: string | null;
  setNewApiKey: (key: string | null) => void;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  onCreateKey: (description?: string) => void;
  isCreating: boolean;
  statusUpdateId: string | null;
  setStatusUpdateId: (id: string | null) => void;
  newStatus: ApiKeyStatus | null;
  handleStatusUpdate: (id: string, status: ApiKeyStatus) => void;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  handleDeleteApiKey: () => void;
  copyToClipboard: (text: string) => void;
}

export function ApiKeyDialogs({
  newApiKey,
  setNewApiKey,
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  onCreateKey,
  isCreating,
  statusUpdateId,
  setStatusUpdateId,
  newStatus,
  handleStatusUpdate,
  deleteId,
  setDeleteId,
  handleDeleteApiKey,
  copyToClipboard,
}: ApiKeyDialogsProps) {
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    onCreateKey(description || undefined);
    setDescription("");
  };

  return (
    <>
      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New API Key
            </DialogTitle>
            <DialogDescription>
              Give your new API key a description to help you identify it later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g. My Production Key"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/100 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create API Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New API Key Dialog (Success) */}
      <Dialog open={!!newApiKey} onOpenChange={() => setNewApiKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              API Key Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your new API key has been generated. Copy it now as you won't be
              able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your API Key</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(newApiKey!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-mono text-sm break-all p-3 bg-background border rounded">
                {newApiKey}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Important Security Notice:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Copy this API key now - you won't see it again</li>
                  <li>Keep it secure and never share it publicly</li>
                  <li>Store it in a secure password manager</li>
                  <li>Regenerate if you suspect it's been compromised</li>
                  <li>Won't be able to view next time</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setNewApiKey(null)} className="w-full">
              I've Saved My API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog
        open={!!statusUpdateId}
        onOpenChange={(open) => !open && setStatusUpdateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus === ApiKeyStatus.INACTIVE
                ? "Deactivate API Key"
                : newStatus === ApiKeyStatus.REVOKED
                  ? "Revoke API Key"
                  : "Activate API Key"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === ApiKeyStatus.INACTIVE
                ? "This will deactivate the API key. You can reactivate it later if needed."
                : newStatus === ApiKeyStatus.REVOKED
                  ? "This will permanently revoke the API key. This action cannot be undone."
                  : "This will activate the API key for use."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => statusUpdateId && newStatus && handleStatusUpdate(statusUpdateId, newStatus)}
              className={
                newStatus === ApiKeyStatus.REVOKED
                  ? "bg-red-600 hover:bg-red-700"
                  : newStatus === ApiKeyStatus.INACTIVE
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
              }
            >
              {newStatus === ApiKeyStatus.INACTIVE
                ? "Deactivate"
                : newStatus === ApiKeyStatus.REVOKED
                  ? "Revoke"
                  : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete API Key
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the API key and remove all access
              associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApiKey}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
