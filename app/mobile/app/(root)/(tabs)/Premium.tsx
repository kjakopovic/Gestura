import { ScrollView, SafeAreaView } from "react-native";
import React from "react";

// import LiveComm from "../(premium-options)/LiveComm";
import UpgradeToPremium from "../(premium-options)/UpgradeToPremium";
import CommChoice from "../(premium-options)/CommChoice";
import { useUserStore } from "@/store/useUserStore";

const Premium = () => {
  const userSubscription = useUserStore((state) => state.user?.subscription);
  const hasLive = userSubscription === 2;

  return (
    <SafeAreaView className="flex-1 bg-grayscale-800">
      <ScrollView className="flex-1">
        {hasLive ? <CommChoice /> : <UpgradeToPremium />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Premium;
