"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Search, Info, Package, MessageSquare } from "lucide-react";
import Image from "next/image";

import {
  DataTable,
  type DataTableFeatures,
} from "@/components/common/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { MarketItem } from "@/types/market";
import { Category } from "@/types/category";
import { fetchUserMarketItems } from "../services/profile-detail";

interface UserMarketTableProps {
  userId: string;
  type: "export" | "import";
  title: string;
  categories: Category[];
  pageSize?: number;
}

export function UserMarketTable({
  userId,
  type,
  title,
  categories,
  pageSize = 5,
}: UserMarketTableProps) {
  const queryClient = useQueryClient();
  const [page, setPageState] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const debouncedSearch = useDebounce(search, 500);

  const queryKeyFor = useCallback(
    (p: number) =>
      [
        `user-${type}-items`,
        userId,
        pageSize,
        { search: debouncedSearch, categoryId },
        p,
      ] as const,
    [userId, type, pageSize, debouncedSearch, categoryId],
  );

  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } =
    useQuery({
      queryKey: queryKeyFor(page),
      queryFn: () =>
        fetchUserMarketItems({
          userId,
          type,
          page,
          pageSize,
          search: debouncedSearch,
          categoryId,
        }),
      staleTime: 60_000,
      placeholderData: keepPreviousData,
    });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: queryKeyFor(page + 1),
        queryFn: () =>
          fetchUserMarketItems({
            userId,
            type,
            page: page + 1,
            pageSize,
            search: debouncedSearch,
            categoryId,
          }),
        staleTime: 60_000,
      });
    }
  }, [
    page,
    totalPages,
    userId,
    type,
    pageSize,
    debouncedSearch,
    categoryId,
    queryClient,
    queryKeyFor,
  ]);

  const setPage = (updater: number | ((p: number) => number)) => {
    const newPage = typeof updater === "function" ? updater(page) : updater;
    setPageState(newPage);
    setRowSelection({});
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
  };

  const columns: ColumnDef<DataTableFeatures, MarketItem>[] = [
    {
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) => {
        const url = row.original.image_url;
        return url ? (
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100">
            <Image
              src={url}
              alt={row.original.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
            <Package size={20} />
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
          {row.original.category?.name || "-"}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: type === "export" ? "Price" : "Est. Price",
      cell: ({ row }) => (
        <span className="font-medium text-emerald-700">
          {row.original.currency?.symbol}{" "}
          {Number(row.original.price).toLocaleString()} /{" "}
          {row.original.unit?.name}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        const whatsappText =
          type === "export"
            ? `Hi%2C%20I'm%20Interested%20With%20Product%20${encodeURIComponent(item.title)}.`
            : `Hi%2C%20I'm%20Interested%20To%20Supply%20For%20Request%20${encodeURIComponent(item.title)}.`;

        return (
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1 h-8">
                    <Info size={14} /> Detail
                  </Button>
                }
              />
              <DialogContent
                className="bg-white text-slate-900 max-w-lg max-h-[90vh] overflow-y-auto"
                initialFocus={false}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {item.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Detailed specification for {title.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2 text-sm">
                  {item.image_url && (
                    <div className="relative h-56 w-full rounded-lg overflow-hidden bg-slate-100">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-xs text-slate-500 block">
                        Category
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.category?.name || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">
                        Country
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.country?.name || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">
                        Price
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {item.currency?.symbol}{" "}
                        {Number(item.price).toLocaleString()} /{" "}
                        {item.unit?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">
                        {type === "export"
                          ? "Minimum Order"
                          : "Target Quantity"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {type === "export"
                          ? item.min_order
                          : item.target_quantity}{" "}
                        {item.unit?.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Description
                    </span>
                    <p className="text-slate-700 text-sm bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {item.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <a
              href={`https://wa.me/${item.whatsapp_number}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <MessageSquare size={14} /> WhatsApp
              </Button>
            </a>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 h-10 bg-white"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div>
          <select
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="flex h-10 w-full text-slate-900 bg-white rounded-md border border-input px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-red-700">
            Failed to load data
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <span className="text-center py-10 text-slate-500 block">
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
            data={items}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}
