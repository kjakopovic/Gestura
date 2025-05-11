import { TypographyType } from "./types";

export const getTypographyStyles = (type: TypographyType): string => {
  let styles: string = "";

  switch (type) {
    case TypographyType.BUTTON_BOLD:
      styles += "gestura-text-button-bold";
      break;
    case TypographyType.BUTTON_NORMAL:
      styles += "gestura-text-button-normal";
      break;
    case TypographyType.LANDING_TITLE:
      styles +=
        "gestura-text-landing-title text-[24px] xs:text-[30px] sm:text-[40px] md:text-[50px] lg:text-[60px] 2xl:text-[70px]";
      break;
    case TypographyType.LANDING_SUBTITLE:
      styles +=
        "gestura-text-landing-subtitle text-[12px] xs:text-[15px] sm:text-[20px] md:text-[25px] lg:text-[30px] 2xl:text-[35px]";
      break;
    case TypographyType.FOOTER_OPTIONS:
      styles +=
        "gestura-text-footer text-[10px] xs:text-[10px] sm:text-[12px] md:text-[12px] lg:text-[14px] 2xl:text-[16px]";
      break;
    case TypographyType.FOOTER_COPYRIGHT:
      styles +=
        "gestura-text-footer text-background-200 text-[8px] xs:text-[8px] sm:text-[10px] md:text-[10px] lg:text-[12px] 2xl:text-[14px]";
      break;
  }

  return styles;
};
