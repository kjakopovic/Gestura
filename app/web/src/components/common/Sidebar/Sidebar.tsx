import { useCallback, useState } from "react";
import { icons } from "@/constants/icons";
import SidebarOption from "./SidebarOption";
import { options, SideBarOptions } from "@/constants/sidebar";
import useMediaQuery from "@/hooks/useMediaQuery";
import SidebarToggleButton from "./SidebarToggleButton";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Props {
  selected: string;
  setSelected: (selected: string) => void;
}

const Sidebar = ({ selected, setSelected }: Props) => {
  const auth = useAuth();
  const isBigScreen = useMediaQuery("(min-width: 851px)");
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const navigate = useNavigate();

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
            className="w-[150px] items-center mt-1 justify-center hover:bg-background-900 cursor-pointer p-2 rounded-lg"
            onClick={() => {
              navigate("/");
            }}
          />
        </div>
        {options.map((option, index) => (
          <SidebarOption
            key={index}
            icon={option.icon}
            label={option.label}
            onClick={() => {
              if (option.label === SideBarOptions.CREATE_ROOM) {
                navigate("/room/create");
              } else if (option.label === SideBarOptions.JOIN_ROOM) {
                navigate("/room/join");
              }

              setSelected(option.label);
            }}
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
