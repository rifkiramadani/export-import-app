"use client";

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Category } from "@/types/category";
import { Country } from "@/types/country";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeroSearchProps {
  categories: Category[];
  countries: Country[];
}

const HeroSearch = ({ categories, countries }: HeroSearchProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"export" | "import">("export");
  const [categoryId, setCategoryId] = useState("all");
  const [countryId, setCountryId] = useState("all");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const targetRoute = type === "export" ? "/products" : "/import-requests";

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId !== "all") params.set("category", categoryId);
    if (countryId !== "all") params.set("country", countryId);

    router.push(`${targetRoute}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 items-center bg-linear-to-br from-secondary to-primary p-4 sm:p-6 shadow-lg rounded-2xl border border-secondary w-full max-w-4xl gap-3"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-white sm:col-span-2 lg:col-span-1">
        Search What You Need Here.
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-white" />
        <Input
          className="pl-9 h-11 placeholder:text-gray-400 bg-gray-700"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as "export" | "import")}
        className="flex h-11 w-full text-white bg-gray-700 rounded-md border border-input px-3 py-1 text-sm shadow-sm focus-visible:outline-0 focus-visible:ring-1"
      >
        <option value="export">Product Exports</option>
        <option value="import">Import Requests</option>
      </select>

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="flex h-11 w-full text-white bg-gray-700 rounded-md border border-input px-3 py-1 text-sm shadow-sm focus-visible:outline-0 focus-visible:ring-1"
      >
        <option value="all">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        value={countryId}
        onChange={(e) => setCountryId(e.target.value)}
        className="flex h-11 w-full text-white bg-gray-700 rounded-md border border-input px-3 py-1 text-sm shadow-sm focus-visible:outline-0 focus-visible:ring-1"
      >
        <option value="all">All Countries</option>
        {countries.map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>

      <Button
        type="submit"
        className="h-11 w-full bg-gray-700 hover:bg-gray-500 sm:col-span-2 lg:col-span-1"
      >
        <Search size={16} />
        <span>Search Now</span>
      </Button>
    </form>
  );
};

export default HeroSearch;
