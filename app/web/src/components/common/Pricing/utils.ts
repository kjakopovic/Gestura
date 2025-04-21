import { icons } from "@/constants/icons";
import { PricingStyles, PricingType } from "./types";
import { images } from "@/constants/images";
import { ButtonType } from "../Button";

export const getPricingStyles = (type: PricingType): PricingStyles => {
  const styles: PricingStyles = {
    image: "",
    title: "",
    subtitle: "",
    price: "",
    checkmarkIcon: "",
    features: [],
    featureTextColor: "",
    containerStyles: "",
    button: {
      type: ButtonType.BASE_FULL,
      text: "",
    },
  };

  switch (type) {
    case PricingType.FREE:
      styles.image = images.freePlanLogo;
      styles.title = "Free";
      styles.subtitle = "Learn sign language for free.";
      styles.price = "0";
      styles.checkmarkIcon = icons.basePlanCheck;
      styles.features = ["Learning sign language"];
      styles.featureTextColor = "text-white";
      styles.button.type = ButtonType.BASE_FULL;
      styles.button.text = "Start for free";
      break;
    case PricingType.PREMIUM:
      styles.image = images.premiumPlanLogo;
      styles.title = "Premium";
      styles.subtitle = "Get learning benefits.";
      styles.price = "5";
      styles.checkmarkIcon = icons.basePlanCheck;
      styles.features = [
        "Infinite Hearts",
        "No Ads",
        "A Badge",
        "AI Enhanced Learning",
      ];
      styles.featureTextColor = "text-white";
      styles.button.type = ButtonType.SECONDARY_FULL;
      styles.button.text = "Subscribe";
      break;
    case PricingType.PREMIUM_PLUS:
      styles.image = images.premiumPlusPlanLogo;
      styles.title = "Premium+";
      styles.subtitle = "Get both learning and live communication benefits.";
      styles.price = "30";
      styles.checkmarkIcon = icons.premiumPlanCheck;
      styles.features = [
        "Infinite Hearts",
        "No Ads",
        "Live Communication",
        "A Special Badge",
      ];
      styles.featureTextColor = "text-primary";
      styles.containerStyles = "border-3 border-primary";
      styles.button.type = ButtonType.PRIMARY_FULL;
      styles.button.text = "Subscribe";
      break;
  }

  return styles;
};
