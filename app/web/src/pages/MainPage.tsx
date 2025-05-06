import { images } from "@/constants/images";
import { Sidebar } from "@/components/common/";
import { useState } from "react";
import { SideBarOptions } from "@/constants/sidebar";

const MainPage = () => {
  const [selected, setSelected] = useState(SideBarOptions.HOME);

  const handleSetSelected = (selected: string) => {
    setSelected(selected as SideBarOptions);
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <img
        src={images.bgImage}
        alt="Background image"
        className="absolute z-0 object-cover w-full h-full"
      />
      <div className="w-full h-full flex flex-row z-10">
        <Sidebar selected={selected} setSelected={handleSetSelected} />
      </div>
    </div>
  );
};

export default MainPage;
