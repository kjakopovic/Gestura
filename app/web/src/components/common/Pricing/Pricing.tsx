import { PricingType } from "./types";
import { getPricingStyles } from "./utils";
import { Typography, TypographyType } from "../Typography";
import { Button } from "../Button";
import PricingFeature from "./PricingFeature";
import { cn } from "@/lib/utils";

interface Props {
  onStartClick?: () => void;
  type?: PricingType;
}

const Pricing = ({ type, onStartClick }: Props) => {
  const styles = getPricingStyles(type || PricingType.FREE);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full ${
        type === PricingType.PREMIUM_PLUS
          ? "mb-10 mt-10 sm:mt-0"
          : "mb-0 sm:-mb-30"
      }`}
    >
      {type === PricingType.PREMIUM_PLUS && (
        <Typography
          text="Most popular"
          type={TypographyType.BUTTON_BOLD}
          styles="text-primary"
        />
      )}
      <div
        className={cn(
          "flex flex-col items-center justify-between h-full sm:h-[90%] w-full lg:w-[80%] bg-background-800 border border-background-400 rounded-2xl p-5",
          styles.containerStyles
        )}
      >
        <div className="flex flex-col items-center justify-center w-[90%] mt-3">
          <div className="flex flex-row w-full items-center justify-start space-x-3">
            <img
              src={styles.image}
              alt="Pricing plan logo for Gestura hands language app"
              className="w-1/4 h-auto object-contain"
            />

            <Typography
              text={styles.title}
              type={TypographyType.BUTTON_BOLD}
              styles={styles.featureTextColor}
            />
          </div>

          <Typography
            text={styles.subtitle}
            type={TypographyType.FOOTER_COPYRIGHT}
            styles="text-white text-start mt-2 w-full"
          />
        </div>

        <div className="flex flex-col items-start justify-start w-[90%] h-[50%]">
          <div className="flex flex-row items-center justify-start space-x-1 w-full">
            <Typography
              text={`€${styles.price}`}
              type={TypographyType.BUTTON_BOLD}
              styles={`${styles.featureTextColor} text-[30px]`}
            />

            <Typography
              text={"/ monthly"}
              type={TypographyType.BUTTON_NORMAL}
              styles="text-white text-[15px]"
            />
          </div>

          <Typography
            text={"What's included"}
            type={TypographyType.BUTTON_BOLD}
            styles="text-white text-[13px]"
          />

          {styles.features.map((feature, index) => (
            <PricingFeature
              key={index}
              text={feature}
              icon={styles.checkmarkIcon}
              styles={"text-background-200"}
            />
          ))}
        </div>

        <Button
          type={styles.button.type}
          text={styles.button.text}
          onClick={onStartClick}
        />
      </div>
    </div>
  );
};

export default Pricing;
