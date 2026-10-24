"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Category, CategoryFormState } from "@/types/category";
import { categorySchema, CategoryForm } from "@/lib/validations/categories.schema";
import { INITIAL_CATEGORY_FORM, INITIAL_STATE_CATEGORY } from "@/constants/categories.constants";
import { adminUpsertCategory } from "../action";

interface CategoryDialogProps {
  category?: Category | null;
}

export function CategoryDialog({ category }: CategoryDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<CategoryFormState>(INITIAL_STATE_CATEGORY);

  const isEditMode = Boolean(category);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema) as unknown as Resolver<CategoryForm>,
    defaultValues: {
      name: category?.name ?? INITIAL_CATEGORY_FORM.name,
    },
  });

  const onSubmit = async (data: CategoryForm) => {
    const formData = new FormData();
    formData.append("name", data.name);

    startServerTransition(async () => {
      const result = await adminUpsertCategory(category?.id ?? null, state, formData);
      setState(result);

      if (result?.status === "success") {
        toast.success(
          isEditMode
            ? "Category updated successfully (Admin)!"
            : "Category created successfully (Admin)!"
        );
        setOpen(false);
        if (!isEditMode) {
          reset();
        }

        await queryClient.invalidateQueries({
          queryKey: ["admin-categories"],
        });
      } else {
        if (result?.status === "error" && result.errors?._form?.[0]) {
          toast.error("Operation Failed", {
            description: result.errors._form[0],
          });
        }
      }
    });
  };

  return (
    <>
      {isEditMode ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-900"
          onClick={() => setOpen(true)}
        >
          <Edit2 size={16} />
        </Button>
      ) : (
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus size={16} /> Add Category (Admin)
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Category (Admin)" : "Add New Category (Admin)"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Fill in the category name below.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label htmlFor="name">Category Name</Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="e.g. Agriculture"
              />
              {formErrors.name?.message && (
                <span className="text-xs text-red-500">
                  {formErrors.name.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isServerPending}
            >
              {isServerPending ? (
                <Spinner />
              ) : isEditMode ? (
                "Update Category"
              ) : (
                "Save Category"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}