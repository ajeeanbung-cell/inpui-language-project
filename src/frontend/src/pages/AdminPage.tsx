import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddAdminPrincipal,
  useAdminSettings,
  useApproveParallelEntry,
  useAwardBadge,
  useContributors,
  useCorpusEntries,
  useDeleteCorpusEntry,
  useExportCorpus,
  useGetAdminPrincipals,
  useIsCallerAdmin,
  usePendingParallelEntries,
  useRejectParallelEntry,
  useRemoveAdminPrincipal,
  useUpdateAdminSettings,
  useUpdateCorpusEntry,
} from "@/hooks/useQueries";
import type { CorpusEntry, ParallelUploadEntry } from "@/types";
import {
  CheckCircle,
  Download,
  Edit2,
  Settings,
  Shield,
  ShieldPlus,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Approvals Tab ─────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const { data: entries = [], isLoading } = usePendingParallelEntries();
  const approve = useApproveParallelEntry();
  const reject = useRejectParallelEntry();

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className="mt-8 flex flex-col items-center gap-3 py-16 text-center"
        data-ocid="approvals-empty"
      >
        <CheckCircle className="h-12 w-12 text-secondary" />
        <p className="text-lg font-semibold text-foreground">All caught up!</p>
        <p className="text-muted-foreground text-sm">
          No pending approvals at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2" data-ocid="approvals-list">
      <div className="hidden md:grid md:grid-cols-[2fr_2fr_1.5fr_auto] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
        <span>Inpui</span>
        <span>English</span>
        <span>Submitted by</span>
        <span>Actions</span>
      </div>
      {entries.map((entry: ParallelUploadEntry, idx: number) => (
        <div
          key={entry.id}
          className={`rounded-lg border border-border px-4 py-3 flex flex-col md:grid md:grid-cols-[2fr_2fr_1.5fr_auto] md:items-center gap-3 transition-smooth ${idx % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
          data-ocid={`approval-row-${entry.id}`}
        >
          <span className="font-semibold text-foreground truncate">
            {entry.inpui}
          </span>
          <span className="text-foreground truncate">{entry.english}</span>
          <span className="text-muted-foreground text-sm truncate">
            {entry.submittedBy ?? "Anonymous"}
          </span>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() =>
                approve.mutate(entry.id, {
                  onSuccess: () => toast.success("Entry approved."),
                  onError: () => toast.error("Failed to approve entry."),
                })
              }
              disabled={approve.isPending}
              data-ocid={`approve-btn-${entry.id}`}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                reject.mutate(entry.id, {
                  onSuccess: () => toast.success("Entry rejected."),
                  onError: () => toast.error("Failed to reject entry."),
                })
              }
              disabled={reject.isPending}
              data-ocid={`reject-btn-${entry.id}`}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Contributions Tab ─────────────────────────────────────────────────────────

interface EditEntryModalProps {
  entry: CorpusEntry;
  onClose: () => void;
}

function EditEntryModal({ entry, onClose }: EditEntryModalProps) {
  const [inpui, setInpui] = useState(entry.inpui);
  const [english, setEnglish] = useState(entry.english);
  const [category, setCategory] = useState(entry.category);
  const [tagsStr, setTagsStr] = useState(entry.tags.join(", "));
  const update = useUpdateCorpusEntry();

  function handleSave() {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    update.mutate(
      { id: entry.id, inpui, english, category, tags },
      {
        onSuccess: () => {
          toast.success("Entry updated successfully.");
          onClose();
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Corpus Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-inpui">Inpui Text</Label>
            <Textarea
              id="edit-inpui"
              value={inpui}
              onChange={(e) => setInpui(e.target.value)}
              rows={2}
              className="resize-none"
              data-ocid="edit-inpui"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-english">English Text</Label>
            <Textarea
              id="edit-english"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              rows={2}
              className="resize-none"
              data-ocid="edit-english"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-category">Category</Label>
            <Input
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-ocid="edit-category"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="tag1, tag2, tag3"
              data-ocid="edit-tags"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={update.isPending}
            className="bg-primary text-primary-foreground"
            data-ocid="save-edit-entry"
          >
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContributionsTab() {
  const { data: entries = [], isLoading } = useCorpusEntries();
  const deleteEntry = useDeleteCorpusEntry();
  const [search, setSearch] = useState("");
  const [editEntry, setEditEntry] = useState<CorpusEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = entries.filter(
    (e) =>
      e.inpui.toLowerCase().includes(search.toLowerCase()) ||
      e.english.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDelete(id: string) {
    deleteEntry.mutate(id, {
      onSuccess: () => {
        toast.success("Entry deleted.");
        setDeleteConfirm(null);
      },
      onError: (e) => toast.error(`Failed to delete: ${e.message}`),
    });
  }

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4" data-ocid="contributions-section">
      <div className="max-w-sm">
        <Input
          placeholder="Search entries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border"
          data-ocid="contributions-search"
        />
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} entries</p>
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filtered.map((entry, idx) => (
          <div
            key={entry.id}
            className={`rounded-lg border border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 transition-smooth ${idx % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
            data-ocid={`contribution-row-${entry.id}`}
          >
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground text-sm">
                {entry.inpui}
              </span>
              <span className="text-muted-foreground text-sm mx-2">—</span>
              <span className="text-foreground text-sm">{entry.english}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {entry.category}
              </Badge>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-border"
                onClick={() => setEditEntry(entry)}
                data-ocid={`edit-entry-${entry.id}`}
              >
                <Edit2 size={12} />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteConfirm(entry.id)}
                disabled={deleteEntry.isPending}
                data-ocid={`delete-entry-${entry.id}`}
              >
                <Trash2 size={12} />
                Delete
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p
            className="text-center text-sm text-muted-foreground py-8"
            data-ocid="contributions-empty"
          >
            No entries match your search.
          </p>
        )}
      </div>

      {/* Edit modal */}
      {editEntry && (
        <EditEntryModal entry={editEntry} onClose={() => setEditEntry(null)} />
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Entry?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              This will permanently delete this corpus entry. This action cannot
              be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteEntry.isPending}
                data-ocid="confirm-delete-entry"
              >
                {deleteEntry.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Admin Roles Tab ───────────────────────────────────────────────────────────

function AdminRolesTab() {
  const { data: principals = [], isLoading } = useGetAdminPrincipals();
  const addAdmin = useAddAdminPrincipal();
  const removeAdmin = useRemoveAdminPrincipal();
  const [newPrincipal, setNewPrincipal] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  function handleAdd() {
    const p = newPrincipal.trim();
    if (!p) return;
    addAdmin.mutate(p, {
      onSuccess: () => {
        toast.success("Admin principal added.");
        setNewPrincipal("");
      },
      onError: (e) => toast.error(`Failed: ${e.message}`),
    });
  }

  function handleRemove(p: string) {
    if (principals.length <= 1) {
      toast.error("Cannot remove the last admin.");
      return;
    }
    removeAdmin.mutate(p, {
      onSuccess: () => {
        toast.success("Admin removed.");
        setRemoveConfirm(null);
      },
      onError: (e) => toast.error(`Failed: ${e.message}`),
    });
  }

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6" data-ocid="admin-roles-section">
      {/* Current admins */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Current Admins
        </h3>
        {principals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No admins set yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {principals.map((p) => (
              <div
                key={p}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                data-ocid={`admin-row-${p.slice(0, 8)}`}
              >
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span
                  className="flex-1 font-mono text-sm text-foreground truncate"
                  title={p}
                >
                  {p.slice(0, 20)}…{p.slice(-6)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveConfirm(p)}
                  aria-label={`Remove admin ${p}`}
                  data-ocid={`remove-admin-${p.slice(0, 8)}`}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new admin */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Add New Admin</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter Internet Identity principal…"
            value={newPrincipal}
            onChange={(e) => setNewPrincipal(e.target.value)}
            className="flex-1 font-mono text-sm bg-card border-border"
            data-ocid="new-admin-principal-input"
          />
          <Button
            onClick={handleAdd}
            disabled={addAdmin.isPending || !newPrincipal.trim()}
            className="gap-1.5 bg-primary text-primary-foreground"
            data-ocid="add-admin-btn"
          >
            <UserPlus size={14} />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste the full principal text of the Internet Identity you want to
          grant admin access.
        </p>
      </div>

      {/* Remove confirm */}
      {removeConfirm && (
        <Dialog open onOpenChange={() => setRemoveConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove Admin?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Remove admin access for:{" "}
              <span className="font-mono text-xs text-foreground">
                {removeConfirm.slice(0, 20)}…
              </span>
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRemove(removeConfirm)}
                disabled={removeAdmin.isPending}
                data-ocid="confirm-remove-admin"
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Donation Settings Tab ─────────────────────────────────────────────────────

function DonationSettingsTab() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [upiId, setUpiId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (!initialized && settings) {
    setUpiId(settings.upiId ?? "");
    setQrCode(settings.upiQrCode ?? "");
    setInitialized(true);
  }

  const isValidImageSrc =
    qrCode.startsWith("http") || qrCode.startsWith("data:image");

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="mt-4 max-w-lg space-y-6" data-ocid="donation-settings-form">
      <div className="space-y-2">
        <Label
          htmlFor="upi-id"
          className="text-sm font-semibold text-foreground"
        >
          UPI ID
        </Label>
        <Input
          id="upi-id"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="yourname@upi"
          className="bg-card border-border"
          data-ocid="upi-id-input"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="qr-code"
          className="text-sm font-semibold text-foreground"
        >
          QR Code URL or Base64 Data
        </Label>
        <Textarea
          id="qr-code"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          placeholder="https://example.com/qr.png  or  data:image/png;base64,..."
          rows={4}
          className="bg-card border-border font-mono text-sm resize-none"
          data-ocid="qr-code-input"
        />
      </div>
      {isValidImageSrc && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            Preview
          </p>
          <img
            src={qrCode}
            alt="QR Code preview"
            className="max-h-48 max-w-48 rounded-md object-contain"
            data-ocid="qr-preview"
          />
        </div>
      )}
      <Button
        onClick={() =>
          update.mutate(
            { upiId, upiQrCode: qrCode || null },
            {
              onSuccess: () => toast.success("Donation settings saved."),
              onError: () => toast.error("Failed to save settings."),
            },
          )
        }
        disabled={update.isPending}
        className="bg-primary text-primary-foreground"
        data-ocid="save-donation-settings"
      >
        {update.isPending ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

// ─── Export Tab ─────────────────────────────────────────────────────────────────

function ExportTab() {
  const exportMutation = useExportCorpus();

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport(format: "csv" | "json") {
    exportMutation.mutate(format, {
      onSuccess: (data) => {
        const ts = new Date().toISOString().slice(0, 10);
        if (format === "csv") {
          downloadFile(data, `inpui-corpus-${ts}.csv`, "text/csv");
        } else {
          downloadFile(data, `inpui-corpus-${ts}.json`, "application/json");
        }
        toast.success(`Corpus exported as ${format.toUpperCase()}.`);
      },
      onError: () => toast.error("Export failed. Please try again."),
    });
  }

  return (
    <div className="mt-6 space-y-6" data-ocid="export-section">
      <div className="rounded-lg border border-border bg-accent/10 px-5 py-4">
        <p className="text-sm text-foreground font-semibold">
          Corpus export — admin only
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Downloads all approved corpus entries. Use for backups, research, or
          offline analysis.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2 border-border"
          onClick={() => handleExport("csv")}
          disabled={exportMutation.isPending}
          data-ocid="export-csv-btn"
        >
          <Download className="h-4 w-4 icon-gold" />
          Export as CSV
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-border"
          onClick={() => handleExport("json")}
          disabled={exportMutation.isPending}
          data-ocid="export-json-btn"
        >
          <Download className="h-4 w-4 icon-gold" />
          Export as JSON
        </Button>
      </div>
    </div>
  );
}

// ─── Contributors Tab ───────────────────────────────────────────────────────────

function ContributorsTab() {
  const { data: contributors = [], isLoading } = useContributors();
  const awardBadge = useAwardBadge();
  const [search, setSearch] = useState("");

  const filtered = contributors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4" data-ocid="contributors-section">
      <div className="max-w-sm">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border"
          data-ocid="contributor-search"
        />
      </div>
      <div className="space-y-2">
        {filtered.map((c, idx) => (
          <div
            key={c.id}
            className={`rounded-lg border border-border px-4 py-3 flex flex-col md:grid md:grid-cols-[auto_2fr_auto_auto_auto] md:items-center gap-3 transition-smooth ${idx % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
            data-ocid={`contributor-row-${c.id}`}
          >
            <span className="text-sm font-bold text-muted-foreground w-8">
              #{idx + 1}
            </span>
            <span className="font-semibold text-foreground">{c.name}</span>
            <span className="text-center text-sm text-foreground font-medium">
              {c.contributions}
            </span>
            <div className="flex justify-center">
              {c.isVerified ? (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-medium gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  Unverified
                </Badge>
              )}
            </div>
            <div>
              {!c.isVerified && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-accent/50 text-accent hover:bg-accent/10 text-xs"
                  onClick={() =>
                    awardBadge.mutate(
                      { contributorId: c.id, badge: "Verified Contributor" },
                      {
                        onSuccess: () => toast.success("Badge awarded!"),
                        onError: () => toast.error("Failed to award badge."),
                      },
                    )
                  }
                  disabled={awardBadge.isPending}
                  data-ocid={`award-badge-btn-${c.id}`}
                >
                  Award Badge
                </Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            className="py-10 text-center text-muted-foreground text-sm"
            data-ocid="contributors-empty"
          >
            No contributors match your search.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: pendingEntries = [] } = usePendingParallelEntries();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const pendingCount = pendingEntries.length;

  if (adminLoading) {
    return (
      <div
        className="flex items-center justify-center py-32"
        data-ocid="admin-loading"
      >
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Checking admin access…
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex items-center justify-center py-32"
        data-ocid="admin-denied"
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Shield className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            You need admin privileges to access this panel. Log in with the
            admin Internet Identity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <div className="rounded-lg bg-primary/10 p-2">
          <ShieldPlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage contributions, roles, approvals, donations, and exports
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="contributions"
        className="w-full"
        data-ocid="admin-tabs"
      >
        <TabsList className="flex flex-wrap w-full bg-muted/40 border border-border rounded-lg h-auto p-1 gap-1">
          <TabsTrigger
            value="contributions"
            className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
            data-ocid="tab-contributions"
          >
            <Edit2 className="h-3.5 w-3.5 icon-gold" />
            <span className="hidden sm:inline">Contributions</span>
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
            data-ocid="tab-roles"
          >
            <Shield className="h-3.5 w-3.5 icon-gold" />
            <span className="hidden sm:inline">Admin Roles</span>
          </TabsTrigger>
          <TabsTrigger
            value="approvals"
            className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
            data-ocid="tab-approvals"
          >
            <Upload className="h-3.5 w-3.5 icon-gold" />
            <span className="hidden sm:inline">Approvals</span>
            {pendingCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="contributors"
            className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
            data-ocid="tab-contributors"
          >
            <Users className="h-3.5 w-3.5 icon-gold" />
            <span className="hidden sm:inline">Contributors</span>
          </TabsTrigger>
          <TabsTrigger
            value="donation"
            className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
            data-ocid="tab-donation"
          >
            <Settings className="h-3.5 w-3.5 icon-gold" />
            <span className="hidden sm:inline">Donations</span>
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
            data-ocid="tab-export"
          >
            <Download className="h-3.5 w-3.5 icon-gold" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="mt-2">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="font-semibold text-foreground text-base">
              All Corpus Contributions
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Edit or delete any corpus entry as admin.
            </p>
            <ContributionsTab />
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-2">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="font-semibold text-foreground text-base">
              Admin Role Management
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage who has admin access to this panel.
            </p>
            <AdminRolesTab />
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="mt-2">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
              Parallel Upload Approvals
              {pendingCount > 0 && (
                <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                  {pendingCount} pending
                </Badge>
              )}
            </h2>
            <ApprovalsTab />
          </div>
        </TabsContent>

        <TabsContent value="contributors" className="mt-2">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="font-semibold text-foreground text-base">
              Manage Contributors
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              View all contributors and award verification badges.
            </p>
            <ContributorsTab />
          </div>
        </TabsContent>

        <TabsContent value="donation" className="mt-2">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="font-semibold text-foreground text-base">
              Donation Settings
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configure the UPI ID and QR code shown in the public Donation
              modal.
            </p>
            <DonationSettingsTab />
          </div>
        </TabsContent>

        <TabsContent value="export" className="mt-2">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="font-semibold text-foreground text-base">
              Corpus Export
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Admin-only. Export all approved corpus entries as CSV or JSON.
            </p>
            <ExportTab />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
