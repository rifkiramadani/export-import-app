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

import { Country, CountryFormState } from "@/types/country";
import { countrySchema, CountryForm } from "@/lib/validations/countries.schema";
import { INITIAL_COUNTRY_FORM, INITIAL_STATE_COUNTRY } from "@/constants/countries.constants";
import { adminUpsertCountry } from "../action";

interface CountryDialogProps {
  country?: Country | null;
}

export function CountryDialog({ country }: CountryDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const [isServerPending, startServerTransition] = useTransition();
  const [state, setState] = useState<CountryFormState>(INITIAL_STATE_COUNTRY);

  const isEditMode = Boolean(country);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<CountryForm>({
    resolver: zodResolver(countrySchema) as unknown as Resolver<CountryForm>,
    defaultValues: {
      name: country?.name ?? INITIAL_COUNTRY_FORM.name,
      code: country?.code ?? INITIAL_COUNTRY_FORM.code,
    },
  });

  const onSubmit = async (data: CountryForm) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("code", data.code);

    startServerTransition(async () => {
      const result = await adminUpsertCountry(country?.id ?? null, state, formData);
      setState(result);

      if (result?.status === "success") {
        toast.success(
          isEditMode
            ? "Country updated successfully (Admin)!"
            : "Country created successfully (Admin)!"
        );
        setOpen(false);
        if (!isEditMode) {
          reset();
        }

        await queryClient.invalidateQueries({
          queryKey: ["admin-countries"],
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
          <Plus size={16} /> Add Country (Admin)
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-slate-900 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Country (Admin)" : "Add New Country (Admin)"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Fill in the country name and code below.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label htmlFor="name">Country Name</Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="e.g. Indonesia"
              />
              {formErrors.name?.message && (
                <span className="text-xs text-red-500">
                  {formErrors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="code">Country Code (ISO)</Label>
              <Input
                {...register("code")}
                id="code"
                placeholder="e.g. ID"
              />
              {formErrors.code?.message && (
                <span className="text-xs text-red-500">
                  {formErrors.code.message}
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
                "Update Country"
              ) : (
                "Save Country"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}