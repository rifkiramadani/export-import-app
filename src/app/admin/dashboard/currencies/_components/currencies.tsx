"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Currency } from "@/types/currency";
import { DataTable } from "@/components/common/data-table";
import type { DataTableFeatures } from "@/components/common/data-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminDeleteCurrencies } from "../action";
import { CurrencyDialog } from "./currency-dialog";
import { CurrencyDeleteButton } from "./currency-delete-button";
import { fetchAdminCurrencies } from "../services/currencies";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminCurrenciesPageProps {
  initialCurrencies: Currency[];
  initialPage: number;
  totalPages: number;
  pageSize: number;
}

export default function AdminCurrenciesPage({
  initialCurrencies,
  initialPage,
  totalPages: initialTotalPages,
  pageSize,
}: AdminCurrenciesPageProps) {
  const queryClient = useQueryClient();

  const [page, setPageState] = useState<number>(initialPage);
  const [search, setSearch] = useState<string>("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, startDeleteTransition] = useTransition();

  const debouncedSearch = useDebounce(search, 500);
  const hasFilter = debouncedSearch.trim() !== "";

  const queryKeyFor = useCallback(
    (p: number) =>
      [
        "admin-currencies",
        pageSize,
        { search: debouncedSearch },
        p,
      ] as const,
    [pageSize, debouncedSearch]
  );

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
    queryFn: () =>
      fetchAdminCurrencies({
        page,
        pageSize,
        search: debouncedSearch,
      }),
    initialData:
      page === initialPage && !hasFilter
        ? { data: initialCurrencies, totalPages: initialTotalPages }
        : undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const currencies = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: queryKeyFor(page + 1),
        queryFn: () =>
          fetchAdminCurrencies({
            page: page + 1,
            pageSize,
            search: debouncedSearch,
          }),
        staleTime: 60_000,
      });
    }
  }, [page, totalPages, pageSize, debouncedSearch, queryClient, queryKeyFor]);

  const setPage = (updater: number | ((p: number) => number)) => {
    const newPage = typeof updater === "function" ? updater(page) : updater;
    setPageState(newPage);
    setRowSelection({});
    window.history.replaceState(null, "", `?page=${newPage}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: ColumnDef<DataTableFeatures, Currency>[] = [
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
      accessorKey: "name",
      header: "Currency Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }) => <span className="font-semibold">{row.original.symbol}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const currency = row.original;
        return (
          <div className="flex items-center gap-1">
            <CurrencyDialog currency={currency} />
            <CurrencyDeleteButton
              currencyId={currency.id}
              currencyName={currency.name}
            />
          </div>
        );
      },
    },
  ];

  const handleBulkDelete = (ids: string[]) => {
    startDeleteTransition(async () => {
      const res = await adminDeleteCurrencies(ids);
      if (res.success) {
        toast.success("Selected currencies deleted successfully (Admin)!");
        setRowSelection({});
        if (page > 1 && ids.length >= currencies.length) {
          setPage(page - 1);
        }
        await queryClient.invalidateQueries({
          queryKey: ["admin-currencies"],
        });
      } else {
        toast.error("Failed to delete currencies", { description: res.message });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Currencies (Admin)
          </h1>
          <p className="text-slate-600 font-light">
            Manage transaction and pricing currencies.
          </p>
        </div>
        <CurrencyDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 h-10"
            placeholder="Search by currency name, code, or symbol..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-red-700">
            Failed to load currencies
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
            data={currencies}
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