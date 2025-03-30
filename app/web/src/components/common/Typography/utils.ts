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
  }

  return styles;
};
