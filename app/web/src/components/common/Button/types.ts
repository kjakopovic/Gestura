import { TypographyType } from "../Typography";

export enum ButtonType {
  PRIMARY_OUTLINE = "primary_outline",
  SECONDARY_OUTLINE = "secondary_outline",
  PRIMARY_FULL = "primary_full",
  SECONDARY_FULL = "secondary_full",
  BASE_FULL = "base_full",
}

export interface ButtonStyles {
  button?: string;
  text?: string;
  textType?: TypographyType;
  icon?: string;
}
