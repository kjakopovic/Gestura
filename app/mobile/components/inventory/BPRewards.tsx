import { Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

import * as icons from "@/constants/icons";

type BPRewardsProps = {
  unclaimedRewards: number;
};

const BPRewards = ({ unclaimedRewards }: BPRewardsProps) => {
  const touchable = unclaimedRewards !== 0;

  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-grayscale-700 w-full flex flex-row justify-between items-center border border-grayscale-400 rounded-xl py-4 px-4 my-4"
      onPress={() => {
        router.push("/(root)/(inventory-options)/BattlePass");
      }}
    >
      <Image
        source={touchable ? icons.bp_chest : icons.bp_chestBW}
        className="size-12"
      />
      <Text
        className={`${
          touchable ? "text-primary" : "text-grayscale-300"
        } text-2xl font-interBold`}
      >
        <Text
          className={`${
            touchable ? "text-primary" : "text-grayscale-300"
          } text-2xl font-interExtraBold`}
        >
          {unclaimedRewards}
        </Text>{" "}
        Unclaimed Rewards
      </Text>
    </TouchableOpacity>
  );
};

export default BPRewards;
