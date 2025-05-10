import { View } from "react-native";
import React from "react";

import PremiumStatus from "@/components/subscription/PremiumStatus";
import LiveStatus from "@/components/subscription/LiveStatus";
import UpgradeToPremium from "@/app/(root)/(premium-options)/UpgradeToPremium";
import { useUserStore } from "@/store/useUserStore";

const Subscription = () => {
  const userSubscription = useUserStore((state) => state.user?.subscription);

  return (
    <View className="flex-1 bg-grayscale-800">
      {userSubscription === 1 && <PremiumStatus />}

      {userSubscription === 2 && <LiveStatus />}

      {userSubscription === 0 && <UpgradeToPremium hasButton />}
    </View>
  );
};

export default Subscription;
