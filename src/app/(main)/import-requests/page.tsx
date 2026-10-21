import { getCategories, getCountries } from "@/services/master";
import ImportRequestPage from "./_components/import-requests";

const Page = async () => {
  const categories = await getCategories();
  const countries = await getCountries();

  return <ImportRequestPage categories={categories} countries={countries} />;
};

export default Page;
