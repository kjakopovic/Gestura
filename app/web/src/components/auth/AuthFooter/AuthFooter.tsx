import { GOOGLE_TYPE_OF_SERVICE } from "@/constants/auth";
import { icons } from "@/constants/icons";
import { handleThirdPartyLogin } from "@/utils/common";

interface Props {
  label?: string;
}

const AuthFooter = ({ label }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center w-full mt-12">
      <p className="text-background-300 gestura-text-landing-title">{label}</p>
      <div className="flex flex-row items-center justify-center w-full gap-x-4 mt-2">
        <img
          src={icons.facebook}
          alt="White Facebook Icon with dark grey background"
          className="w-10 h-10 cursor-pointer"
        />
        <img
          src={icons.apple}
          alt="Apple Icon with dark grey background"
          className="w-8 h-8 cursor-pointer"
        />
        <img
          src={icons.google}
          alt="Google Icon with dark grey background"
          className="w-8 h-8 cursor-pointer"
          onClick={() => handleThirdPartyLogin(GOOGLE_TYPE_OF_SERVICE)}
        />
      </div>
    </div>
  );
};

export default AuthFooter;
