import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Link as LinkIcon, Sparkles } from "lucide-react";

import { useCreateLink } from "@/hooks/useLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com)"),
  tags: z.string().optional(),
  expirationDate: z.string().optional(),
});

type CreateLinkValues = z.infer<typeof createLinkSchema>;

interface CreateLinkDialogProps {
  /** Optional custom trigger element. Defaults to a "+ New Link" button. */
  trigger?: React.ReactNode;
}

export function CreateLinkDialog({ trigger }: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const createLink = useCreateLink();

  const form = useForm<CreateLinkValues>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: { originalUrl: "" },
  });

  const onSubmit = (values: CreateLinkValues) => {
    console.log("onSubmit=", values);

    const tagsArray = values.tags
      ? values.tags.split(",").map((tag) => tag.trim())
      : [];
    let expirationDate: Date | undefined = undefined;
    if (values.expirationDate) {
      expirationDate = new Date(values.expirationDate);
    }

    console.log("createLink.mutate=", {
      originalUrl: values.originalUrl,
      tags: tagsArray,
      expirationDate: expirationDate,
    });
    createLink.mutate(
      {
        originalUrl: values.originalUrl,
        tags: tagsArray,
        expirationDate: expirationDate,
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          toast.success("Link created successfully!");
        },
        onError: (error) => {
          toast.error(error.message);
          console.error("url creation error = ", error)
        }
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Create Short Link
          </DialogTitle>
          <DialogDescription>
            Paste a long URL to create a short link. You can optionally add tags
            and an expiration date.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 py-2"
          >
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/very/long/path"
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
              render={({ field }) => (
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expiration Date{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    The link will expire after this date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLink.isPending}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {createLink.isPending ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
