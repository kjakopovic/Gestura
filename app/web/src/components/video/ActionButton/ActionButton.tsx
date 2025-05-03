import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

const ActionButton = ({ className, icon, active, onClick }: Props) => {
  return (
    <div
      className={cn(
        "w-[75px] h-[75px] rounded-xl cursor-pointer border border-background-400 flex items-center justify-center p-6",
        { "bg-error border-none": !active },
        className
      )}
      onClick={onClick}
    >
      <img src={icon} alt="Action button for video" className="w-full h-full" />
    </div>
  );
};

export default ActionButton;
