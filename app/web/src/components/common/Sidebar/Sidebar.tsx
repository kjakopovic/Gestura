import { useCallback, useState } from "react";
import { icons } from "@/constants/icons";
import SidebarOption from "./SidebarOption";
import { options, SideBarOptions } from "@/constants/sidebar";
import useMediaQuery from "@/hooks/useMediaQuery";
import SidebarToggleButton from "./SidebarToggleButton";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = () => {
  const auth = useAuth();
  const [selected, setSelected] = useState(SideBarOptions.HOME);
  const isBigScreen = useMediaQuery("(min-width: 500px)");
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <>
      <aside
        className={`w-full xs:w-[45%] xs:rounded-r-4xl sm:w-[35%] lg:w-[25%] h-full bg-background-800 p-4 fixed top-0 left-0 ${
          isOpen ? "translate-x-0" : "translate-x-[-100%] md:translate-x-0"
        }
          transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-row justify-between w-full mb-6">
          {!isBigScreen && (
            <SidebarToggleButton
              isOpen={isOpen}
              toggleSidebar={toggleSidebar}
            />
          )}

          <img
            src={icons.logoText}
            alt="Gestura logo image with a hand showing OK but G instead of O"
            className="w-[150px] items-center mt-1 justify-center"
          />
        </div>
        {options.map((option, index) => (
          <SidebarOption
            key={index}
            icon={option.icon}
            label={option.label}
            onClick={() => setSelected(option.label)}
            isSelected={selected === option.label}
          />
        ))}
        <SidebarOption
          icon={icons.logout}
          label={SideBarOptions.LOGOUT}
          onClick={() => auth?.removeTokensFromCookies()}
          isSelected={false}
        />
      </aside>

      {!isOpen && (
        <SidebarToggleButton
          isOpen={isOpen}
          toggleSidebar={toggleSidebar}
          className="fixed top-4 left-3"
        />
      )}
    </>
  );
};

export default Sidebar;
