import { useState } from "react";
import { icons } from "@/constants/icons";
import SidebarOption from "./SidebarOption";
import { options } from "@/constants/sidebar";

const Sidebar = () => {
    const [selected, setSelected] = useState("Home");

    return (
        <div className="w-[50%] sm:w-[45%] md:w-[40%] lg:w-[25%] h-full bg-background-800 p-4 fixed top-0 left-0 rounded-r-4xl">
            {" "}
            <img
                src={icons.logoText}
                alt="Gestura logo image with a hand showing OK but G instead of O"
                className="w-[150px] xs:w-[200px] lg:w-70 h-auto mb-6"
            />
            {options.map((option, index) => (
                <SidebarOption
                    key={index}
                    icon={option.icon}
                    label={option.label}
                    onClick={() => setSelected(option.label)}
                    isSelected={selected === option.label}
                />
            ))}
        </div>
    );
};

export default Sidebar;
