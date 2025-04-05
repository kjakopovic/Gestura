import { images } from "@/constants/images";
import StoreBadge from "../StoreBadge/StoreBadge";
import { cn } from "@/lib/utils";
import { redirectToAppleStore, redirectToGoogleStore } from "@/utils/common";
import { ClickableLogo } from "@/components/elements";

interface Props {
  styles?: string;
}

const Navbar = ({ styles }: Props) => (
  <div
    className={cn(
      "navbar flex flex-row w-full bg-transparent justify-between items-center py-4 px-5",
      styles
    )}
  >
    <ClickableLogo />

    <div className="flex flex-col xs:flex-row gap-5 items-center justify-center h-[20px] xs:h-[30px]">
      <StoreBadge
        alt="Gestura badge for redirection to google play store"
        src={images.googleStoreBadge}
        onClick={redirectToGoogleStore}
      />
      <StoreBadge
        alt="Gestura badge for redirection to app store"
        src={images.appStoreBadge}
        onClick={redirectToAppleStore}
      />
    </div>
  </div>
);

export default Navbar;
