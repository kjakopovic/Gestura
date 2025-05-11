import { ScrollView, SafeAreaView } from "react-native";
import React from "react";

import UpgradeToPremium from "../(premium-options)/UpgradeToPremium";
import CommChoice from "../(premium-options)/CommChoice";
import { useUserStore } from "@/store/useUserStore";

const Premium = () => {
  const userSubscription = useUserStore((state) => state.user?.subscription);
  const hasLive = userSubscription === 2;

  return (
    <SafeAreaView className="h-full bg-grayscale-800">
      <ScrollView className="flex-1 w-full mt-28">
        {hasLive ? <CommChoice /> : <UpgradeToPremium />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Premium;
