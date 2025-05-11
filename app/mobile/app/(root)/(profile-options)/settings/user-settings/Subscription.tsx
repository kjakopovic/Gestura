import React from "react";

import PremiumStatus from "@/components/subscription/PremiumStatus";
import LiveStatus from "@/components/subscription/LiveStatus";
import UpgradeToPremium from "@/app/(root)/(premium-options)/UpgradeToPremium";
import { useUserStore } from "@/store/useUserStore";
import { SafeAreaView } from "react-native-safe-area-context";

const Subscription = () => {
  const userSubscription = useUserStore((state) => state.user?.subscription);

  return (
    <SafeAreaView className="bg-grayscale-800 h-full">
      {userSubscription === 1 && <PremiumStatus />}

      {userSubscription === 2 && <LiveStatus />}

      {userSubscription === 0 && <UpgradeToPremium hasButton />}
    </SafeAreaView>
  );
};

export default Subscription;
