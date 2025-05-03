import { Text, ScrollView } from "react-native";
import React from "react";

import Quest from "@/components/inventory/Quest";
import Item from "@/components/inventory/Item";
import BPRewards from "@/components/inventory/BPRewards";
import { SafeAreaView } from "react-native-safe-area-context";

const Inventory = () => {
  return (
    <SafeAreaView className="flex-1 items-center bg-grayscale-800">
      <ScrollView
        className="w-full p-2"
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >
        <Text className="text-xl text-grayscale-100 font-interBold mt-16 ml-4">
          DAILY CHEST
        </Text>

        {/* <Quest
          title="Complete a task."
          progress={0}
          maxProgress={1}
          iconName="chest"
        /> */}
        <Quest
          title="Complete a task."
          progress={1}
          maxProgress={1}
          iconName="chest"
        />
        <Text className="text-xl text-grayscale-100 font-interBold mt-16 ml-4">
          ITEMS
        </Text>
        <Item
          itemTitle="Double XP Token"
          iconName="experience_token"
          buttonText="ACTIVATE"
        />
        <Item itemTitle="Regular Chest" iconName="chest" buttonText="OPEN" />

        <Text className="text-xl text-grayscale-100 font-interBold mt-16 ml-4">
          BATTLE PASS
        </Text>
        <BPRewards unclaimedRewards={7} />
        {/* <BPRewards unclaimedRewards={0} /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Inventory;
