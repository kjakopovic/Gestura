import { icons } from "@/constants/icons";
import { Typography, TypographyType } from "../Typography";
import ClickableTypography from "../ClickableTypography";
import StoreBadge from "../StoreBadge";
import { images } from "@/constants/images";
import { cn } from "@/lib/utils";
import {
  redirectToAppleStore,
  redirectToGoogleStore,
  redirectToOtherPage,
} from "@/utils/common";
import { NavigateFunction } from "react-router-dom";

interface Props {
  styles?: string;
  navigate?: NavigateFunction;
}

const Footer = ({ styles, navigate }: Props) => (
  <footer
    className={cn(
      "flex flex-row items-center justify-between w-full bg-transparent p-4",
      styles
    )}
  >
    <div className="text-center flex flex-col items-start">
      <img src={icons.logo} alt="Gestura logo" className="h-15 w-15 mb-3" />

      <div className="flex flex-row items-center justify-center gap-4 mb-2">
        <ClickableTypography
          type={TypographyType.FOOTER_OPTIONS}
          text="Download now"
          styles="text-primary hover:text-primary/80"
          onClick={redirectToGoogleStore}
        />

        <ClickableTypography
          type={TypographyType.FOOTER_OPTIONS}
          text="License"
          styles="text-white hover:text-white/80"
          onClick={() => {
            redirectToOtherPage("/license", navigate);
          }}
        />
      </div>

      <div className="grid grid-cols-2 xs:flex xs:flex-row items-center justify-center gap-4 mb-2">
        <ClickableTypography
          type={TypographyType.FOOTER_OPTIONS}
          text="About"
          styles="text-white hover:text-white/80"
          onClick={() => {
            redirectToOtherPage("/about", navigate);
          }}
        />

        <ClickableTypography
          type={TypographyType.FOOTER_OPTIONS}
          text="News"
          styles="text-white hover:text-white/80"
          onClick={() => {
            redirectToOtherPage("/news", navigate);
          }}
        />

        <ClickableTypography
          type={TypographyType.FOOTER_OPTIONS}
          text="Help"
          styles="text-white hover:text-white/80"
          onClick={() => {
            redirectToOtherPage("/help", navigate);
          }}
        />

        <ClickableTypography
          type={TypographyType.FOOTER_OPTIONS}
          text="Contact"
          styles="text-white hover:text-white/80"
          onClick={() => {
            redirectToOtherPage("/contact", navigate);
          }}
        />
      </div>

      <Typography
        type={TypographyType.FOOTER_COPYRIGHT}
        text="&copy; 2025 Gestura. All rights reserved."
      />
    </div>

    <div className="flex flex-col items-center justify-center space-y-5">
      <Typography
        type={TypographyType.FOOTER_OPTIONS}
        text="Get the App"
        styles="text-primary text-start w-full"
      />

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
  </footer>
);

export default Footer;
