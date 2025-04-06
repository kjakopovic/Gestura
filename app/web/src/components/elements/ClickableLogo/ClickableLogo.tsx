import { icons } from "@/constants/icons";

interface Props {
  onClick?: () => void;
}

const ClickableLogo = ({ onClick }: Props) => {
  return (
    <img
      src={icons.logoText}
      alt="Gestura logo image with a hand showing OK but G instead of O"
      className="w-[150px] xs:w-[150px] pr-5 lg:w-1/8 h-auto hover:bg-background-800 p-[8px] rounded-lg hover:cursor-pointer"
      onClick={onClick}
    />
  );
};

export default ClickableLogo;
