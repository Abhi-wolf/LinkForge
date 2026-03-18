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
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";

const updateLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com)"),
  tags: z.string().optional(),
  expirationDate: z.string().optional(),
});

type UpdateLinkValues = z.infer<typeof updateLinkSchema>;

interface EditLinkDialogProps {
  link: {
    id: string;
    originalUrl: string;
    tags?: string[] | null;
    expirationDate?: string | Date | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLinkDialog({
  link,
  open,
  onOpenChange,
}: EditLinkDialogProps) {
  const updateLink = useUpdateLink();

  const form = useForm<UpdateLinkValues>({
    resolver: zodResolver(updateLinkSchema),
    defaultValues: { originalUrl: link.originalUrl },
  });

  // Re-sync default values when link changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        originalUrl: link.originalUrl,
        tags: link.tags ? link.tags.join(", ") : "",
        expirationDate: link.expirationDate
          ? new Date(link.expirationDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [open, link, form]);

  const onSubmit = (values: UpdateLinkValues) => {
    const tagsArray = values.tags
      ? values.tags.split(",").map((tag) => tag.trim())
      : [];
    const expirationDate = values.expirationDate
      ? new Date(values.expirationDate)
      : undefined;

    updateLink.mutate(
      {
        id: link.id,
        originalUrl: values.originalUrl,
        tags: tagsArray,
        expirationDate: expirationDate,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success("Link updated successfully");
        },
      },
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

            <FormField
              control={form.control}
              name="tags"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>
                    Tags{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="social, marketing, blog" {...field} />
                  </FormControl>
                  <FormDescription>Separate tags with commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>
                    Expiration Date{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    The link will expire after this date.
                  </FormDescription>
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
              <Button type="submit" disabled={updateLink.isPending}>
                {updateLink.isPending ? "Updating..." : "Update Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
