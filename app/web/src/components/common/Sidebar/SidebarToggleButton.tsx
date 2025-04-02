import { cn } from "@/utils/lib";

interface Props {
  isOpen: boolean;
  toggleSidebar: () => void;
  className?: string;
}

const SidebarToggleButton = ({
  isOpen,
  toggleSidebar,
  className = "",
}: Props) => {
  return (
    <button
      onClick={toggleSidebar}
      className={cn("p-4 focus:outline-none md:hidden text-white", className)}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isOpen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        )}
      </svg>
    </button>
  );
};

export default SidebarToggleButton;
