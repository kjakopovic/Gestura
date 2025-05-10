import { View } from "react-native";
import React from "react";

import PremiumStatus from "@/components/subscription/PremiumStatus";
import LiveStatus from "@/components/subscription/LiveStatus";
import UpgradeToPremium from "@/app/(root)/(premium-options)/UpgradeToPremium";

const Subscription = () => {
  let subscriptionLevel = "live"; //hardcodirano

  return (
    <View className="flex-1 bg-grayscale-800">
      {subscriptionLevel === "premium" && <PremiumStatus />}

      {subscriptionLevel === "live" && <LiveStatus />}

      {subscriptionLevel === "none" && <UpgradeToPremium hasButton />}
    </View>
  );
};

export default Subscription;
