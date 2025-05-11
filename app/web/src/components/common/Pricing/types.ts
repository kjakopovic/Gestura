import { ButtonType } from "../Button";

export enum PricingType {
  FREE = "free",
  PREMIUM = "premium",
  PREMIUM_PLUS = "premium_plus",
}

export interface PricingStyles {
  image: string;
  title: string;
  subtitle: string;
  price: string;
  checkmarkIcon: string;
  features: string[];
  featureTextColor: string;
  containerStyles: string;
  button: {
    type: ButtonType;
    text: string;
  };
}
