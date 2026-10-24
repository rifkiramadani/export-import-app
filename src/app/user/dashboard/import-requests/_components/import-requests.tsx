"use client";

import { useEffect, useState, useTransition } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ImportRequest } from "@/types/import-request";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Unit } from "@/types/unit";
import { Currency } from "@/types/currency";
import { DataTable } from "@/components/common/data-table";
import type { DataTableFeatures } from "@/components/common/data-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteImportRequests } from "../action";
import Image from "next/image";
import { ImportRequestsDialog } from "./import-requests-dialog";
import { ImportRequestDeleteButton } from "./import-requests-delete-button";
import { fetchUserImportRequests } from "../services/import-requests";

const priceFormatter = new Intl.NumberFormat("en-US");

interface ImportRequestPageProps {
  initialRequests: ImportRequest[];
  categories: Category[];
  countries: Country[];
  units: Unit[];
  currencies: Currency[];
  profileId: string;
  initialPage: number;
  totalPages: number;
  pageSize: number;
}

export default function ImportRequestsPage({
  initialRequests,
  categories,
  countries,
  units,
  currencies,
  profileId,
  initialPage,
  totalPages: initialTotalPages,
  pageSize,
}: ImportRequestPageProps) {
  const queryClient = useQueryClient();

  const [page, setPageState] = useState<number>(initialPage);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, startDeleteTransition] = useTransition();

  const queryKeyFor = (p: number) =>
    ["import-requests", profileId, pageSize, p] as const;

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey: queryKeyFor(page),
    queryFn: () => fetchUserImportRequests(profileId, page, pageSize),
    // Halaman yang dirender server dipakai sebagai data awal
    initialData:
      page === initialPage
        ? { data: initialRequests, totalPages: initialTotalPages }
        : undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const requests = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Prefetch halaman berikutnya di latar belakang
  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: queryKeyFor(page + 1),
        queryFn: () => fetchUserImportRequests(profileId, page + 1, pageSize),
        staleTime: 60_000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages, profileId, pageSize]);

  // Ganti halaman tanpa menjalankan ulang server component
  const setPage = (updater: number | ((p: number) => number)) => {
    const newPage = typeof updater === "function" ? updater(page) : updater;
    setPageState(newPage);
    setRowSelection({});
    window.history.replaceState(null, "", `?page=${newPage}`);
  };

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
    { accessorKey: "title", header: "Request Title" },
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
      cell: ({ row }) => (
        <span>
          {row.original.target_quantity} {row.original.unit?.name}
        </span>
      ),
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
        // Kalau semua baris di halaman ini terhapus, mundur satu halaman
        if (page > 1 && ids.length >= requests.length) {
          setPage(page - 1);
        }
        await queryClient.invalidateQueries({ queryKey: ["import-requests"] });
      } else {
        toast.error("Failed to delete import requests", {
          description: res.message,
        });
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

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-red-700">
            Failed to load import requests
          </p>
          <p className="text-xs text-red-600">{error?.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <span className="text-center py-20 text-slate-500 block">
          Loading...
        </span>
      ) : (
        <div
          aria-busy={isFetching}
          className={`transition-opacity duration-200 ${
            isFetching && isPlaceholderData ? "opacity-60" : "opacity-100"
          }`}
        >
          <DataTable
            columns={columns}
            data={requests}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkDelete={handleBulkDelete}
            isDeleting={isDeleting}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}