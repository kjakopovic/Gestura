import { images } from "@/constants/images";
import { Sidebar } from "@/components/common/";

const MainPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <img
        src={images.bgImage}
        alt="Background image"
        className="absolute z-0 object-cover w-full h-full"
      />
      <Sidebar />
    </div>
  );
};

export default MainPage;
