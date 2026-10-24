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
import { adminDeleteCategories } from "../action";

interface CategoryDeleteButtonProps {
  categoryId: string;
  categoryName: string;
}

export function CategoryDeleteButton({
  categoryId,
  categoryName,
}: CategoryDeleteButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await adminDeleteCategories([categoryId]);
      if (res.success) {
        toast.success("Category deleted successfully (Admin)!");
        setOpen(false);
        await queryClient.invalidateQueries({
          queryKey: ["admin-categories"],
        });
      } else {
        toast.error("Failed to delete category", { description: res.message });
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
        aria-label="Delete category"
      >
        <Trash2 size={16} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Delete Category (Admin)
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete category{" "}
              <span className="font-medium text-slate-900">{categoryName}</span>
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
