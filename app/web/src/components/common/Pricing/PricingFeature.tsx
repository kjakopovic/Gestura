import { cn } from "@/utils/lib";
import { Typography, TypographyType } from "../Typography";

interface Props {
  icon: string;
  text: string;
  styles?: string;
}

const PricingFeature = ({ icon, text, styles }: Props) => {
  return (
    <div
      className={cn(
        "flex flex-row items-center justify-start w-full mt-2",
        styles
      )}
    >
      <img
        src={icon}
        alt="Checkmark icon for Gestura hands language app pricing"
        className="w-4 mr-2"
      />

      <Typography
        text={text}
        type={TypographyType.BUTTON_NORMAL}
        styles="text-[12px]"
      />
    </div>
  );
};

export default PricingFeature;
