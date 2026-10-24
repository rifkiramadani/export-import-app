"use client";

import { useState, useTransition } from "react";
import { ImportRequest } from "@/types/import-request";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Unit } from "@/types/unit";
import { Currency } from "@/types/currency";
import { DataTable } from "@/components/common/data-table";
import type { DataTableFeatures } from "@/components/common/data-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { deleteImportRequests } from "../action";
import Image from "next/image";
import { ImportRequestsDialog } from "./import-requests-dialog";
import { ImportRequestDeleteButton } from "./import-requests-delete-button";

const priceFormatter = new Intl.NumberFormat("en-US");

interface ImportRequestPageProps {
  initialRequests: ImportRequest[];
  categories: Category[];
  countries: Country[];
  units: Unit[];
  currencies: Currency[];
  profileId: string;
}

export default function ImportRequestsPage({
  initialRequests,
  categories,
  countries,
  units,
  currencies,
  profileId,
}: ImportRequestPageProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, startDeleteTransition] = useTransition();

  const columns: ColumnDef<DataTableFeatures, ImportRequest>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) => {
        const url = row.getValue("image_url") as string | null;
        return url ? (
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100">
            <Image
              src={url}
              alt="Request"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-xs text-slate-400">
            No Img
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Request Title",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span>{row.original.category?.name || "-"}</span>,
    },
    {
      accessorKey: "price",
      header: "Target Price",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="font-semibold">
            {item.currency?.symbol} {priceFormatter.format(Number(item.price))}{" "}
            / {item.unit?.name}
          </span>
        );
      },
    },
    {
      accessorKey: "target_quantity",
      header: "Target Qty",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span>
            {item.target_quantity} {item.unit?.name}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="flex items-center gap-1">
            <ImportRequestsDialog
              request={request}
              categories={categories}
              countries={countries}
              units={units}
              currencies={currencies}
              profileId={profileId}
            />
            <ImportRequestDeleteButton
              requestId={request.id}
              requestTitle={request.title}
            />
          </div>
        );
      },
    },
  ];

  const handleBulkDelete = (ids: string[]) => {
    startDeleteTransition(async () => {
      const res = await deleteImportRequests(ids);
      if (res.success) {
        toast.success("Selected import requests deleted successfully!");
        setRowSelection({});
      } else {
        toast.error("Failed to delete import requests", { description: res.message });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Your Import Requests
          </h1>
          <p className="text-slate-600 font-light">
            Manage your import requests and sourcing requirements.
          </p>
        </div>
        <ImportRequestsDialog
          categories={categories}
          countries={countries}
          units={units}
          currencies={currencies}
          profileId={profileId}
        />
      </div>

      <DataTable
        columns={columns}
        data={initialRequests ?? []}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}