import React, { useState } from "react";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import SidebarOption from "./SidebarOption";

const Sidebar = () => {
    const [selected, setSelected] = useState("Home");

    const options = [
        {
            icon: <img src={images.home_2} className="w-6 h-6" />,
            label: "Home",
            onClick: () => setSelected("Home"),
        },
        {
            icon: <img src={images.create} className="w-6 h-6" />,
            label: "Create Room",
            onClick: () => setSelected("Create Room"),
        },
        {
            icon: <img src={images.join} className="w-6 h-6" />,
            label: "Join Room",
            onClick: () => setSelected("Join Room"),
        },
        {
            icon: <img src={images.invite} className="w-6 h-6" />,
            label: "Invite Friends",
            onClick: () => setSelected("Invite Friends"),
        },
        {
            icon: <img src={images.logout} className="w-6 h-6" />,
            label: "Log out",
            onClick: () => setSelected("Log out"),
        },
    ];

    return (
        <div className="w-96 h-full bg-background-800 p-4 fixed top-0 left-0 rounded-r-4xl">
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
                    onClick={option.onClick}
                    isSelected={selected === option.label}
                />
            ))}
        </div>
    );
};

export default Sidebar;
