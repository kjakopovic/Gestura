import { images } from "@/constants/images";
import {
  Button,
  ButtonType,
  Pricing,
  PricingType,
  Sidebar,
  Typography,
  TypographyType,
} from "@/components/common/";
import { useEffect, useState } from "react";
import { SideBarOptions } from "@/constants/sidebar";
import {
  handleGetUserSubscription,
  handlePatchUserSubscription,
} from "@/utils/user";
import { useAuth } from "@/hooks/useAuth";
import { HelperFunctionResponse } from "@/constants/common";

const MainPage = () => {
  const auth = useAuth();

  const [selected, setSelected] = useState(SideBarOptions.HOME);
  const [subscription, setSubscription] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleSetSelected = (selected: string) => {
    setSelected(selected as SideBarOptions);
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      setIsLoading(true);

      const subscription = await handleGetUserSubscription(auth);
      setSubscription(subscription);

      setIsLoading(false);
    };

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Typography
          type={TypographyType.LANDING_SUBTITLE}
          text="Loading..."
          styles="text-white"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <img
        src={images.bgImage}
        alt="Background image"
        className="absolute z-0 object-cover w-full h-full"
      />
      {subscription > 1 ? (
        <div className="w-full h-full flex flex-row justify-end z-10">
          <Sidebar selected={selected} setSelected={handleSetSelected} />

          <div className="w-full h-full flex flex-col items-center justify-center md:w-[65%] lg:w-[75%] md:pl-7">
            <div className="w-full h-[50%] flex flex-col items-center justify-center gap-5">
              <Typography
                type={TypographyType.LANDING_SUBTITLE}
                text="Learning feature is not yet on web."
                styles="text-center w-full text-primary"
              />
              <Typography
                type={TypographyType.LANDING_SUBTITLE}
                text="You can still use web chat!"
                styles="text-center w-full text-white"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col sm:w-[33%] h-full mt-10 z-10">
          <Button
            type={ButtonType.PRIMARY_FULL}
            text="Logout"
            styles="lg:mx-[50px] xl:mx-[100px]"
            onClick={() => auth?.removeTokensFromCookies()}
          />
          <Pricing
            type={PricingType.PREMIUM_PLUS}
            onStartClick={async () => {
              const response = await handlePatchUserSubscription(auth, 2);

              if (response === HelperFunctionResponse.SUCCESS) {
                window.location.reload();
              } else {
                alert("An error happened while updating your subscription");
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MainPage;
