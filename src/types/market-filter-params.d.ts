export interface MarketFilterParams {
  search?: string;
  type: "export" | "import";
  categoryId?: string;
  countryId?: string;
  page?: number;
  limit: number;
}
