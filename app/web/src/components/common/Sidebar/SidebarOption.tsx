import React from "react";

interface Props {
    icon: string;
    label: string;
    onClick?: () => void;
    isSelected: boolean;
}

const SidebarOption: React.FC<Props> = ({
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
            <img src={icon} alt={label} className="w-6 h-6" />
            <span className="text-white text-xl">{label}</span>
        </div>
    );
};

export default SidebarOption;
