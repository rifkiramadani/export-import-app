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

import { Currency, CurrencyFormState } from "@/types/currency";
import { currencySchema, CurrencyForm } from "@/lib/validations/currencies.schema";
import { INITIAL_CURRENCY_FORM, INITIAL_STATE_CURRENCY } from "@/constants/currencies.constants";
import { adminUpsertCurrency } from "../action";

interface CurrencyDialogProps {
  currency?: Currency | null;
}

export function CurrencyDialog({ currency }: CurrencyDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<CurrencyFormState>(INITIAL_STATE_CURRENCY);

  const isEditMode = Boolean(currency);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<CurrencyForm>({
    resolver: zodResolver(currencySchema) as unknown as Resolver<CurrencyForm>,
    defaultValues: {
      name: currency?.name ?? INITIAL_CURRENCY_FORM.name,
      code: currency?.code ?? INITIAL_CURRENCY_FORM.code,
      symbol: currency?.symbol ?? INITIAL_CURRENCY_FORM.symbol,
    },
  });

  const onSubmit = async (data: CurrencyForm) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("code", data.code);
    formData.append("symbol", data.symbol);

    startServerTransition(async () => {
      const result = await adminUpsertCurrency(currency?.id ?? null, state, formData);
      setState(result);

      if (result?.status === "success") {
        toast.success(
          isEditMode
            ? "Currency updated successfully (Admin)!"
            : "Currency created successfully (Admin)!"
        );
        setOpen(false);
        if (!isEditMode) {
          reset();
        }

        await queryClient.invalidateQueries({
          queryKey: ["admin-currencies"],
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
          <Plus size={16} /> Add Currency (Admin)
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Currency (Admin)" : "Add New Currency (Admin)"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Fill in the currency details below.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label htmlFor="name">Currency Name</Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="e.g. US Dollar"
              />
              {formErrors.name?.message && (
                <span className="text-xs text-red-500">
                  {formErrors.name.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="code">Code</Label>
                <Input
                  {...register("code")}
                  id="code"
                  placeholder="e.g. USD"
                />
                {formErrors.code?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.code.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  {...register("symbol")}
                  id="symbol"
                  placeholder="e.g. $"
                />
                {formErrors.symbol?.message && (
                  <span className="text-xs text-red-500">
                    {formErrors.symbol.message}
                  </span>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isServerPending}
            >
              {isServerPending ? (
                <Spinner />
              ) : isEditMode ? (
                "Update Currency"
              ) : (
                "Save Currency"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}