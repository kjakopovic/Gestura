import {
  Navbar,
  Button,
  ButtonType,
  Typography,
  TypographyType,
  Footer,
} from "@/components/common";
import { images } from "@/constants/images";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Navbar styles="z-10" />

      <div className="z-10 flex flex-col items-start justify-end gap-4 mt-10 mb-10 w-full h-[70vh]">
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
          />
          <Button
            text="Pricing"
            type={ButtonType.SECONDARY_OUTLINE}
            styles="w-full"
          />
        </div>
      </div>

      <div className="z-10 flex items-center justify-center gap-4 mt-10 mb-10 w-[90%] h-[90vh]">
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
      </div>

      <div className="z-10 flex items-center justify-center gap-4 mt-10 mb-10 w-[90%] h-[90vh]">
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
      </div>

      <div className="z-10 flex items-center justify-center gap-4 mt-10 mb-10 w-[90%] h-[90vh]">
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <Typography
            type={TypographyType.LANDING_TITLE}
            text="TODO:"
            styles="text-white -mb-2 sm:mb-1 md:mb-4 lg:mb-6 2xl:mb-8"
          />

          <Typography
            type={TypographyType.LANDING_SUBTITLE}
            text="I need to add pricing here"
            styles="text-primary"
          />
        </div>
      </div>

      <Footer styles="z-10 " />

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full ">
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
          className="object-cover w-full h-[115vh] transform rotate-180 scale-x-[-1] bg-background-600 -mt-1"
        />
      </div>
    </div>
  );
};

export default LandingPage;
