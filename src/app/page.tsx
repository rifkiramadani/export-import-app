import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <div className="max-w-full min-h-screen ">
      <div className="flex items-center justify-center">
        <Link href={"#"}>
          <Button>Access Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
