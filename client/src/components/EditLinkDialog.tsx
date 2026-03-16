import { useEffect } from "react";
// @ts-expect-error - useForm is exported but lint server is acting up
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";

import { useUpdateLink } from "@/hooks/useLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const updateLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com)"),
});

type UpdateLinkValues = z.infer<typeof updateLinkSchema>;

interface EditLinkDialogProps {
  link: {
    id: string;
    originalUrl: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLinkDialog({ link, open, onOpenChange }: EditLinkDialogProps) {
  const updateLink = useUpdateLink();

  const form = useForm<UpdateLinkValues>({
    resolver: zodResolver(updateLinkSchema),
    defaultValues: { originalUrl: link.originalUrl },
  });

  // Re-sync default values when link changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({ originalUrl: link.originalUrl });
    }
  }, [open, link.originalUrl, form]);

  const onSubmit = (values: UpdateLinkValues) => {
    updateLink.mutate(
      {
        id: link.id,
        originalUrl: values.originalUrl,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Link
          </DialogTitle>
          <DialogDescription>
            Update the destination URL for this short link.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Destination URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/new-path"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLink.isPending}
              >
                {updateLink.isPending ? "Updating..." : "Update Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
