"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminDeleteImportRequests } from "../action";

interface AdminDeleteImportRequestButtonProps {
  requestId: string;
  requestTitle: string;
}

export function AdminImportRequestDeleteButton({
  requestId,
  requestTitle,
}: AdminDeleteImportRequestButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await adminDeleteImportRequests([requestId]);
      if (res.success) {
        toast.success("Import request deleted successfully (Admin)!");
        setOpen(false);
        await queryClient.invalidateQueries({
          queryKey: ["admin-import-requests"],
        });
      } else {
        toast.error("Failed to delete import request", {
          description: res.message,
        });
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-red-600"
        onClick={() => setOpen(true)}
        aria-label="Delete import request"
      >
        <Trash2 size={16} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Delete Import Request (Admin)
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-900">{requestTitle}</span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white min-w-20"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
