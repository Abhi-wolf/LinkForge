import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  ExternalLink,
  BarChart2,
  Trash2,
  QrCode as QrCodeIcon,
  AlertTriangle,
  Plus,
  Edit,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useLinks, useDeleteLink, useUpdateLinkStatus } from "@/hooks/useLinks";
import { CreateLinkDialog } from "@/components/CreateLinkDialog";
import { EditLinkDialog } from "@/components/EditLinkDialog";
import type { ShortLink } from "@/services/mockApi";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function MyLinks() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [editLink, setEditLink] = useState<any | null>(null);
  const [qrLink, setQrLink] = useState<ShortLink | null>(null);

  const { data: links, isLoading } = useLinks();
  const deleteMutation = useDeleteLink();
  const updateStatusMutation = useUpdateLinkStatus();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
    });
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus }, {
      onSettled: () => setBlockId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
          <p className="text-muted-foreground">Manage your shortened URLs</p>
        </div>
        <div className="border rounded-md p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <ExternalLink className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">No links yet</h2>
        <p className="text-muted-foreground max-w-sm">
          You haven't created any short links yet. Go to the dashboard to create
          your first link.
        </p>
        <CreateLinkDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create your first link
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
          <p className="text-muted-foreground">Manage your shortened URLs</p>
        </div>
        <CreateLinkDialog />
      </div>

      <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Original URL</TableHead>
              <TableHead>Short URL</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">
                  <div
                    className="truncate max-w-[280px]"
                    title={link.originalUrl}
                  >
                    {link.originalUrl}
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={link.fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {link.fullUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  {new Date(link.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {link.expirationDate
                    ? new Date(link.expirationDate).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      link.status.toLowerCase() === "active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      link.status.toLowerCase() === "active"
                        ? "bg-green-500 hover:bg-green-600"
                        : link.status.toLowerCase() === "blocked" 
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : ""
                    }
                  >
                    {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          navigator.clipboard.writeText(link.shortUrl)
                        }
                      >
                        Copy Short URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditLink(link)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/dashboard/analytics/${link.id}`)
                        }
                      >
                        <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setQrLink(link as any)}>
                        <QrCodeIcon className="mr-2 h-4 w-4" /> Generate QR
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {link.status.toLowerCase() === "active" ? (
                        <DropdownMenuItem
                          className="text-orange-500 focus:text-orange-600 focus:bg-orange-50"
                          onClick={() => setBlockId(link.id)}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" /> Block Link
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-green-600 focus:text-green-700 focus:bg-green-50"
                          onClick={() => handleStatusUpdate(link.id, "active")}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" /> Activate Link
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10"
                        onClick={() => setDeleteId(link.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Link Dialog */}
      {editLink && (
        <EditLinkDialog 
          link={editLink} 
          open={!!editLink} 
          onOpenChange={(open) => !open && setEditLink(null)} 
        />
      )}

      {/* Block Confirmation Dialog */}
      <Dialog
        open={!!blockId}
        onOpenChange={(open) => !open && setBlockId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              Confirm Blocking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block this link? Users who click it will no longer be redirected to the original destination.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 outline-none focus:ring-orange-500"
              onClick={() => blockId && handleStatusUpdate(blockId, "blocked")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Blocking..." : "Block Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this link? This action cannot be
              undone and all analytics will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrLink} onOpenChange={(open) => !open && setQrLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {qrLink?.alias}</DialogTitle>
            <DialogDescription>
              Scan this QR code to visit the link directly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6 pb-2">
            {qrLink && (
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <QRCodeSVG value={qrLink.shortUrl} size={200} />
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQrLink(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
