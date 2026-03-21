import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  ExternalLink,
  BarChart2,
  Trash2,
  QrCode as QrCodeIcon,
  AlertTriangle,
  Edit,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useLinks, useDeleteLink, useUpdateLinkStatus } from "@/hooks/useLinks";
import { CreateLinkDialog } from "@/components/CreateLinkDialog";
import { EditLinkDialog } from "@/components/EditLinkDialog";


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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UrlStatus, type ShortLink } from "@/types/url.types";

const ITEMS_PER_PAGE = 10;

export default function MyLinks() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [editLink, setEditLink] = useState<ShortLink | null>(null);
  const [qrLink, setQrLink] = useState<ShortLink | null>(null);

  // Filter and Pagination State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<UrlStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data with options
  const fetchOptions = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  }), [debouncedSearch, status, startDate, endDate, page]);

  const { data, isLoading } = useLinks(fetchOptions);

  // Handle new data structure { urls, total }
  const links = data?.urls || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const deleteMutation = useDeleteLink();
  const updateStatusMutation = useUpdateLinkStatus();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      {
        onSettled: () => setDeleteId(null),
        onSuccess: () => {
          toast.success("Link deleted");
        },
        onError: () => {
          toast.error("Failed to delete link");
        },
      },
    );
  };

  const handleStatusUpdate = (id: string, newStatus: UrlStatus) => {
    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSettled: () => setDeactivateId(null),
        onSuccess: () => {
          toast.success("Link status updated");
        },
        onError: (error) => {
          console.error("Error updating link status:", error);
          toast.error(error.message || "Failed to update link status");
        },
      },
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters = search || status !== "all" || startDate || endDate;

  if (isLoading && page === 1) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">My Links</h1>
            <p className="text-muted-foreground">Manage and track your shortened URLs</p>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-xl p-0 overflow-hidden shadow-sm">
          <div className="p-4 bg-muted/30 border-b">
            <Skeleton className="h-6 w-full" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">My Links</h1>
          <p className="text-muted-foreground">Manage and track your shortened URLs</p>
        </div>
        <CreateLinkDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 bg-card p-4 rounded-xl border shadow-sm backdrop-blur-sm bg-opacity-50">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none"
          />
        </div>

        <Select value={status} onValueChange={(val) => { setStatus(val as UrlStatus | "all"); setPage(1); }}>
          <SelectTrigger className="bg-muted/50 border-none focus:ring-1 focus:ring-primary shadow-none">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 group border-none">
          <div className="relative flex-1 group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none appearance-none"
              title="Created After"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="relative flex-1 group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none appearance-none"
              title="Created Before"
            />
          </div>
        </div>



        {hasActiveFilters && (
          <div className="flex items-center justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              <X className="mr-2 h-3 w-3" /> Clear All
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-[300px] font-semibold">Original URL</TableHead>
                <TableHead className="font-semibold">Short URL</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Expires</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-muted/50">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium">No links found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your filters or search keywords.</p>
                      </div>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id} className="group transition-colors">
                    <TableCell className="font-medium">
                      <div
                        className="truncate max-w-[280px] font-normal"
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
                        className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 font-medium transition-colors"
                      >
                        {link.fullUrl.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(link.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      {link.expirationDate ? (
                        <span className={`text-sm ${new Date(link.expirationDate) < new Date() ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {/* {new Date(link.expirationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} */}
                          {new Date(link.expirationDate).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
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
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm px-2.5 py-0.5"
                            : link.status.toLowerCase() === "blocked" || link.status.toLowerCase() === "expired"
                              ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 px-2.5 py-0.5"
                              : "bg-muted text-muted-foreground border-none px-2.5 py-0.5"
                        }
                      >
                        {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(link.fullUrl);
                              toast.success("Short URL copied to clipboard");
                            }}
                          >
                            Copy Short URL
                          </DropdownMenuItem>
                          {link.status !== UrlStatus.EXPIRED && <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              setEditLink(link as unknown as ShortLink)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Link
                          </DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(`/dashboard/analytics/${link.id}`)
                            }
                          >
                            <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setQrLink(link as unknown as ShortLink)}
                          >
                            <QrCodeIcon className="mr-2 h-4 w-4" /> Generate QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {link.status.toLowerCase() === "active" && (
                            <DropdownMenuItem
                              className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer"
                              onClick={() => setDeactivateId(link.id)}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" /> Deactivate
                              Link
                            </DropdownMenuItem>
                          )}

                          {(link.status.toLowerCase() === "inactive" || link.status.toLowerCase() === "expired") && (
                            <DropdownMenuItem
                              className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                              onClick={() =>
                                handleStatusUpdate(link.id, UrlStatus.ACTIVE)
                              }
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" /> Activate Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => setDeleteId(link.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Showing <span className="font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
            <span className="font-medium">{Math.min(page * ITEMS_PER_PAGE, total)}</span> of{" "}
            <span className="font-medium">{total}</span> links
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 p-0 ${page === pageNum ? 'shadow-sm' : ''}`}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && (page < totalPages - 2) && <span className="text-muted-foreground px-1">...</span>}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}

      {/* Edit Link Dialog */}
      {editLink && (
        <EditLinkDialog
          link={editLink}
          open={!!editLink}
          onOpenChange={(open) => !open && setEditLink(null)}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={!!deactivateId}
        onOpenChange={(open) => !open && setDeactivateId(null)}
      >
        <DialogContent className="sm:max-w-md ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="h-6 w-6 text-orange-500" />
              Confirm Deactivation
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to deactivate this link? Users who click it
              will no longer be redirected to the original destination.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeactivateId(null)} className="sm:mr-2">
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-md focus:ring-orange-500"
              onClick={() =>
                deactivateId &&
                handleStatusUpdate(deactivateId, UrlStatus.INACTIVE)
              }
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? "Deactivating..."
                : "Deactivate Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to delete this link? This action cannot be
              undone and all analytics will be lost forever.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="sm:mr-2">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="shadow-md"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrLink} onOpenChange={(open) => !open && setQrLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">QR Code for Your Link</DialogTitle>
            <DialogDescription className="truncate max-w-full">
              {qrLink?.fullUrl}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            {qrLink && (
              <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-muted/20 hover:scale-105 transition-transform duration-300">
                <QRCodeSVG value={qrLink.fullUrl} size={220} level="H" includeMargin />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code with any mobile device to open the link instantly.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQrLink(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
