import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import StoreBadge from "../StoreBadge/StoreBadge";
import { cn } from "@/lib/utils";

interface Props {
  styles?: string;
}

const Navbar = ({ styles }: Props) => (
  <div
    className={cn(
      "navbar flex flex-row w-full bg-transparent justify-between items-center py-7 px-5",
      styles
    )}
  >
    <img
      src={icons.logoText}
      alt="Gestura logo image with a hand showing OK but G instead of O"
      className="w-[150px] xs:w-[200px] lg:w-1/6 h-auto"
    />

    <div className="flex flex-col xs:flex-row gap-5 items-center justify-center h-[20px] xs:h-[30px]">
      <StoreBadge
        alt="Gestura badge for redirection to google play store"
        src={images.googleStoreBadge}
      />
      <StoreBadge
        alt="Gestura badge for redirection to app store"
        src={images.appStoreBadge}
      />
    </div>
  </div>
);

export default Navbar;
