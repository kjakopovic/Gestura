import { Navbar, Button, ButtonType } from "@/components/common";
import { images } from "@/constants/images";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <Navbar styles="z-10" />
      <Button
        text="Get started"
        type={ButtonType.SECONDARY_OUTLINE}
        styles="z-10"
      />
      <button onClick={() => (window.location.href = "/login")}>Login</button>
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
          className="object-cover w-full h-screen bg-background-600 transform scale-x-[-1]"
        />
        <img
          src={images.bgImage}
          alt="Gestura background image"
          className="object-cover w-full h-screen transform rotate-180 scale-x-[-1] bg-background-600 -mt-1"
        />
      </div>
    </div>
  );
};

export default LandingPage;
