"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchMarketItems } from "@/services/market";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { Button } from "@base-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageSquare,
  ShoppingCart,
  Search,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface ImportRequestClientProps {
  categories: Category[];
  countries: Country[];
}

const ImportRequestPage = ({
  categories,
  countries,
}: ImportRequestClientProps) => {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("category") || "all",
  );
  const [countryId, setCountryId] = useState(
    searchParams.get("country") || "all",
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: [
      "import-requests",
      { search: debouncedSearch, categoryId, countryId, page },
    ],
    queryFn: () =>
      fetchMarketItems({
        search: debouncedSearch,
        type: "import", // Mengambil data import_requests
        categoryId,
        countryId,
        page,
        limit: 1,
      }),
  });

  const items = data?.data || [];
  const totalPages = data?.totalPages;

  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">
          Import Requests Available On Forum
        </h1>
        <p className="text-slate-600 font-light">
          Find Buy Requests & Sourcing Opportunities From Global Importers
        </p>
      </div>

      {/* Filter Bar dengan style persis pilihanmu */}
      <div className="bg-linear-to-br items-center from-secondary to-primary p-4 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-white sm:col-span-2 lg:col-span-1">
          Specify <br />
          Your Search.
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-white" />
          <Input
            className="pl-9 h-11 placeholder:text-gray-400 bg-gray-700 text-white"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            value={categoryId}
            onChange={(e) => handleFilterChange(setCategoryId, e.target.value)}
            className="flex h-11 w-full text-white bg-gray-700 rounded-md border border-input px-3 py-1 text-sm shadow-sm focus-visible:outline-0 focus-visible:ring-1"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={countryId}
            onChange={(e) => handleFilterChange(setCountryId, e.target.value)}
            className="flex h-11 w-full text-white bg-gray-700 rounded-md border border-input px-3 py-1 text-sm shadow-sm focus-visible:outline-0 focus-visible:ring-1"
          >
            <option value="all">All Countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid Card */}
      {isLoading ? (
        <span className="text-center py-20 text-slate-500 block">
          Loading...
        </span>
      ) : items.length === 0 ? (
        <span className="text-center py-20 text-slate-500 block">
          No Import Requests Available.
        </span>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div>
                {item.image_url ? (
                  <div className="h-48 w-full bg-slate-100">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ShoppingCart size={48} />
                  </div>
                )}
                <CardHeader className="pb-3 pt-3">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md flex items-center gap-1">
                      <Tag size={12} /> {item.category?.name}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md flex items-center gap-1">
                      <Globe size={12} /> {item.country?.name}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-1">
                    {item.title}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Oleh:{" "}
                    <span className="font-semibold text-slate-700">
                      {item.profile?.company_name || item.profile?.name}
                    </span>
                  </p>
                </CardHeader>
                <CardContent className="pb-3 text-sm text-slate-600 space-y-2">
                  <p className="line-clamp-2">{item.description}</p>
                  <div className="font-bold text-slate-900 text-base">
                    Est. Price: {item.currency?.symbol}{" "}
                    {Number(item.price).toLocaleString()} / {item.unit?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Target Quantity:{" "}
                    <span className="font-semibold text-slate-700">
                      {item.target_quantity} {item.unit?.name}
                    </span>
                  </div>
                </CardContent>
              </div>
              <CardFooter className="pt-0">
                <a
                  href={`https://wa.me/${item.whatsapp_number}?text=Hi%2C%20I'm%20Interested%20To%20Supply%20For%20Request%20${encodeURIComponent(item.title)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="flex justify-center flex-row w-full h-9 items-center bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-md">
                    <MessageSquare size={16} />
                    <Label>Message Whatsapp</Label>
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages! > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            className="flex flex-row bg-gray-700 hover:bg-gray-500 text-white p-2 rounded-md text-sm font-light items-center transition-all disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={22} />
            Prev
          </Button>
          <span className="text-sm font-light text-slate-600">
            Page {page} From {totalPages}
          </span>
          <Button
            className="flex flex-row bg-gray-700 hover:bg-gray-500 text-white p-2 rounded-md text-sm font-light items-center transition-all disabled:opacity-50"
            disabled={page >= totalPages!}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight size={22} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImportRequestPage;
