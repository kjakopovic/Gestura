import React from "react";

interface SidebarOptionProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    isSelected: boolean;
}

const SidebarOption: React.FC<SidebarOptionProps> = ({
    icon,
    label,
    onClick,
    isSelected,
}) => {
    return (
        <div
            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition ${
                isSelected
                    ? "bg-background-500 text-black"
                    : "hover:bg-background-700 text-white"
            }`}
            onClick={onClick}
        >
            <div className="text-white text-xl">{icon}</div>
            <span className="text-white text-xl">{label}</span>
        </div>
    );
};

export default SidebarOption;
