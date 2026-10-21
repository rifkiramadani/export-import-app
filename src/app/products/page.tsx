import { getCategories, getCountries } from "@/services/master";
import ProductPage from "./_components/products";

const Page = async () => {
  const categories = await getCategories();
  const countries = await getCountries();

  return <ProductPage categories={categories} countries={countries} />;
};

export default Page;
