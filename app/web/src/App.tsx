import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <div className="flex min-h-screen h-full bg-background-800">
      {/* <SideBar /> TODO: ovo je primjer kako sam bio radio sidebar */}

      <main className="flex-1 mt-[10%] md:ml-[20%] md:mt-0 overflow-y-auto h-screen">
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;
