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

import { Unit, UnitFormState } from "@/types/unit";
import { unitSchema, UnitForm } from "@/lib/validations/units.schema";
import { INITIAL_UNIT_FORM, INITIAL_STATE_UNIT } from "@/constants/units.constants";
import { adminUpsertUnit } from "../action";

interface UnitDialogProps {
  unit?: Unit | null;
}

export function UnitDialog({ unit }: UnitDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<UnitFormState>(INITIAL_STATE_UNIT);

  const isEditMode = Boolean(unit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<UnitForm>({
    resolver: zodResolver(unitSchema) as unknown as Resolver<UnitForm>,
    defaultValues: {
      name: unit?.name ?? INITIAL_UNIT_FORM.name,
    },
  });

  const onSubmit = async (data: UnitForm) => {
    const formData = new FormData();
    formData.append("name", data.name);

    startServerTransition(async () => {
      const result = await adminUpsertUnit(unit?.id ?? null, state, formData);
      setState(result);

      if (result?.status === "success") {
        toast.success(
          isEditMode
            ? "Unit updated successfully (Admin)!"
            : "Unit created successfully (Admin)!"
        );
        setOpen(false);
        if (!isEditMode) {
          reset();
        }

        await queryClient.invalidateQueries({
          queryKey: ["admin-units"],
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
          <Plus size={16} /> Add Unit (Admin)
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Unit (Admin)" : "Add New Unit (Admin)"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Fill in the unit name below (e.g. Kg, Ton, Pcs).
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label htmlFor="name">Unit Name</Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="e.g. Ton"
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
                "Update Unit"
              ) : (
                "Save Unit"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}