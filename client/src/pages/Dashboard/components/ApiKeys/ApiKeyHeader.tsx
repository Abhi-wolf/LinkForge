import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiKeyHeaderProps {
  onCreateKey: () => void;
  isPending: boolean;
}

export function ApiKeyHeader({
  onCreateKey,
  isPending,
}: ApiKeyHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          API Keys
        </h1>
        <p className="text-muted-foreground">
          Manage your API keys for programmatic access to your account
        </p>
      </div>
      <div className="flex items-center gap-2">

        <Button
          onClick={onCreateKey}
          disabled={isPending}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Creating..." : "Create API Key"}
        </Button>
      </div>
    </div>
  );
}
