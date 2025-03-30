import { Navbar } from "@/components";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <Navbar />
      <button onClick={() => (window.location.href = "/login")}>Login</button>
    </div>
  );
};

export default LandingPage;
