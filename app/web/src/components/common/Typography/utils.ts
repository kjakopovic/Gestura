import { TypographyType } from "./types";

export const getTypographyStyles = (type: TypographyType): string => {
  var styles: string = "";

  switch (type) {
    case TypographyType.BUTTON_BOLD:
      styles += "text-button-bold";
      break;
    case TypographyType.BUTTON_NORMAL:
      styles += "text-button-normal";
      break;
    case TypographyType.LANDING_TITLE:
      styles +=
        "text-landing-title text-[24px] xs:text-[30px] sm:text-[40px] md:text-[50px] lg:text-[60px] 2xl:text-[70px]";
      break;
    case TypographyType.LANDING_SUBTITLE:
      styles +=
        "text-landing-subtitle text-[12px] xs:text-[15px] sm:text-[20px] md:text-[25px] lg:text-[30px] 2xl:text-[35px]";
      break;
  }

  return styles;
};
