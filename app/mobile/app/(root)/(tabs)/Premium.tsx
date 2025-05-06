import { ScrollView, SafeAreaView } from "react-native";
import React from "react";

// import LiveComm from "../(premium-options)/LiveComm";
import UpgradeToPremium from "../(premium-options)/UpgradeToPremium";
import CommChoice from "../(premium-options)/CommChoice";

const Premium = () => {
  const hasPremium = true; // ovo replaceat za stvarnim premium statusom

  return (
    <SafeAreaView className="flex-1 bg-grayscale-800">
      <ScrollView className="flex-1">
        {hasPremium ? <CommChoice /> : <UpgradeToPremium />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Premium;
