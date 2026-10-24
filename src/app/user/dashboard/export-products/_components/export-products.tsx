"use client";

import { useEffect, useState, useTransition } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ExportProduct } from "@/types/export-product";
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
import { deleteProducts } from "../action";
import Image from "next/image";
import { ExportProductsDialog } from "./export-products-dialog";
import { ExportProductDeleteButton } from "./export-products-delete-button";
import { fetchUserExportProducts } from "../services/export-products";

const priceFormatter = new Intl.NumberFormat("en-US");

interface ExportProductPageProps {
  initialProducts: ExportProduct[];
  categories: Category[];
  countries: Country[];
  units: Unit[];
  currencies: Currency[];
  profileId: string;
  initialPage: number;
  totalPages: number;
  pageSize: number;
}

export default function ExportProductPage({
  initialProducts,
  categories,
  countries,
  units,
  currencies,
  profileId,
  initialPage,
  totalPages: initialTotalPages,
  pageSize,
}: ExportProductPageProps) {
  const queryClient = useQueryClient();

  const [page, setPageState] = useState<number>(initialPage);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, startDeleteTransition] = useTransition();

  const queryKeyFor = (p: number) =>
    ["user-export-products", profileId, pageSize, p] as const;

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
    queryFn: () => fetchUserExportProducts(profileId, page, pageSize),
    // Halaman yang dirender server dipakai sebagai data awal
    initialData:
      page === initialPage
        ? { data: initialProducts, totalPages: initialTotalPages }
        : undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Prefetch halaman berikutnya di latar belakang
  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: queryKeyFor(page + 1),
        queryFn: () => fetchUserExportProducts(profileId, page + 1, pageSize),
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

  const columns: ColumnDef<DataTableFeatures, ExportProduct>[] = [
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
              alt="Product"
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
      header: "Product Title",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span>{row.original.category?.name || "-"}</span>,
    },
    {
      accessorKey: "price",
      header: "Price",
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
      accessorKey: "min_order",
      header: "Min Order",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span>
            {item.min_order} {item.unit?.name}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1">
            <ExportProductsDialog
              product={product}
              categories={categories}
              countries={countries}
              units={units}
              currencies={currencies}
              profileId={profileId}
            />
            <ExportProductDeleteButton
              productId={product.id}
              productTitle={product.title}
            />
          </div>
        );
      },
    },
  ];

  const handleBulkDelete = (ids: string[]) => {
    startDeleteTransition(async () => {
      const res = await deleteProducts(ids);
      if (res.success) {
        toast.success("Selected products deleted successfully!");
        setRowSelection({});
        // Kalau semua baris di halaman ini terhapus, mundur satu halaman
        if (page > 1 && ids.length >= products.length) {
          setPage(page - 1);
        }
        await queryClient.invalidateQueries({
          queryKey: ["user-export-products"],
        });
      } else {
        toast.error("Failed to delete products", { description: res.message });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Your Products
          </h1>
          <p className="text-slate-600 font-light">
            Manage your export product catalog listings and inventory.
          </p>
        </div>
        <ExportProductsDialog
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
            Failed to load products
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
            data={products}
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