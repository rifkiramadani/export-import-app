import HeroSearch from "@/components/common/hero-search";
import { getCategories, getCountries } from "@/services/master";

const Home = async () => {
  const categories = await getCategories();
  const countries = await getCountries();
  return (
    <div className="min-h-screen flex flex-col select-none">
      <main className="relative flex-1 flex flex-col items-center justify-center gap-4 px-4 py-8 bg-[url('/landing-page-background.jpeg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative text-center max-w-4xl flex flex-col gap-3 dynamic-text-shadow">
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-bold text-white tracking-tight drop-shadow-lg">
            Welcome
            <span className="bg-linear-to-br from-secondary to-primary bg-clip-text text-transparent">
              .
            </span>
          </h1>
          <span className="text-center font-thin text-white/95 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Looking for your next trade partner? Search products from exporters
            around the world, post what you need to import, and reach the right
            people in just a few clicks.
          </span>
        </div>

        <div className="relative w-full max-w-4xl mt-2 drop-shadow-2xl">
          <HeroSearch categories={categories} countries={countries} />
        </div>
      </main>
    </div>
  );
};
export default Home;
