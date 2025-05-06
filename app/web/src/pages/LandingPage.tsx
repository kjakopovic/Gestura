import {
  Navbar,
  Button,
  ButtonType,
  Typography,
  TypographyType,
  Footer,
  Pricing,
  PricingType,
} from "@/components/common";
import { Dialog } from "@/components/elements";
import { APP_ROUTES } from "@/constants/common";
import { images } from "@/constants/images";
import useMediaQuery from "@/hooks/useMediaQuery";
import { redirectToGoogleStore, redirectToBuy } from "@/utils/common";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const IS_MOBILE = useMediaQuery("(max-width: 700px)");
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Navbar styles="z-10" />

      <section
        id="welcome"
        className="z-10 flex flex-col items-start justify-end gap-4 mt-10 mb-10 w-full h-[70vh]"
      >
        <div className="flex h-full w-full xs:w-[70%] flex-col items-center justify-center">
          <Typography
            type={TypographyType.LANDING_TITLE}
            text="Sign language made easy"
            styles="text-white -mb-2 sm:mb-1 md:mb-4 lg:mb-6 2xl:mb-8"
          />

          <Typography
            type={TypographyType.LANDING_SUBTITLE}
            text="Learn with Gestura"
            styles="text-primary"
          />
        </div>

        <div className="flex flex-row items-center justify-center gap-4 ml-0 sm:ml-[10%] w-[100%] xs:[70%] sm:w-[50%] md:w-[40%] lg:w-[32%]">
          <Button
            text="Get started"
            type={ButtonType.PRIMARY_OUTLINE}
            styles="w-full"
            onClick={() => navigate(APP_ROUTES.MAIN_PAGE)}
          />
          <Button
            text="Pricing"
            type={ButtonType.SECONDARY_OUTLINE}
            styles="w-full"
            onClick={() => document.getElementById("pricing")?.scrollIntoView()}
          />
        </div>
      </section>

      <section
        id="marketing-1"
        className="z-10 flex items-center justify-center gap-4 mt-10 mb-10 w-[90%] h-[90vh]"
      >
        <div className="flex h-full w-full flex-col items-center justify-center">
          <img
            src={images.phoneMockup}
            alt="Gestura app on phone mockup"
            className="w-full h-full"
          />
        </div>

        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <Typography
            type={TypographyType.LANDING_TITLE}
            text="Learn sign language in a fun and interactive way!"
            styles="text-white -mb-2 sm:mb-1 md:mb-4 lg:mb-6 2xl:mb-8"
          />

          <Typography
            type={TypographyType.LANDING_SUBTITLE}
            text="Our mobile app allows for a very smooth and motivating experience."
            styles="text-primary"
          />
        </div>
      </section>

      <section
        id="marketing-2"
        className="z-10 flex items-center justify-center gap-4 mt-10 mb-10 w-[90%] h-[90vh]"
      >
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <Typography
            type={TypographyType.LANDING_TITLE}
            text="Communicate live no matter of your sign language knowledge"
            styles="text-white -mb-2 sm:mb-1 md:mb-4 lg:mb-6 2xl:mb-8"
          />

          <Typography
            type={TypographyType.LANDING_SUBTITLE}
            text="Don’t let language to be your barrier."
            styles="text-primary"
          />
        </div>

        <div className="flex h-full w-full flex-col items-center justify-center">
          <img
            src={images.phoneMockup2}
            alt="Gestura app on phone mockup"
            className="w-full h-full"
          />
        </div>
      </section>

      <section
        id="pricing"
        className="z-10 flex items-center justify-center gap-4 mt-10 mb-10 w-[90%] h-full sm:h-[100vh]"
      >
        <div className="h-full flex flex-col sm:flex-row w-full lg:w-[90%] items-center justify-between text-center">
          <Pricing
            type={PricingType.FREE}
            onStartClick={() => {
              setOpenDialog(true);
            }}
          />
          <Pricing
            type={PricingType.PREMIUM_PLUS}
            onStartClick={() => redirectToBuy(navigate)}
          />
          <Pricing
            type={PricingType.PREMIUM}
            onStartClick={() => redirectToBuy(navigate)}
          />
        </div>
      </section>

      <Footer styles="z-10 bg-background-800" navigate={navigate} />

      <Dialog
        open={openDialog}
        setOpen={setOpenDialog}
        title="Please choose your platform"
        show={{
          firstButton: true,
          secondButton: true,
          close: true,
        }}
        firstButton={{
          type: ButtonType.PRIMARY_FULL,
          text: "Mobile",
          onClick: redirectToGoogleStore,
        }}
        secondButton={{
          type: ButtonType.SECONDARY_FULL,
          text: "Web",
          onClick: () => navigate(APP_ROUTES.LOGIN),
        }}
      />

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src={images.bgImage}
          alt="Gestura background image"
          className="object-cover w-full h-screen bg-background-600"
        />
        <img
          src={images.bgImage}
          alt="Gestura background image"
          className="object-cover w-full h-screen transform rotate-180 bg-background-600 -mt-1"
        />
        <img
          src={images.bgImage}
          alt="Gestura background image"
          className="object-cover w-full h-screen bg-background-600 transform scale-x-[-1] -mt-1"
        />
        <img
          src={images.bgImage}
          alt="Gestura background image"
          className="object-cover w-full h-screen transform rotate-180 scale-x-[-1] bg-background-600 -mt-1"
        />
        {!IS_MOBILE && (
          <img
            src={images.bgImage}
            alt="Gestura background image"
            className="object-cover w-full h-[130vh] bg-background-600 sm:hidden"
          />
        )}
      </div>
    </div>
  );
};

export default LandingPage;
