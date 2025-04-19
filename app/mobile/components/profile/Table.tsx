import { View, Text } from "react-native";
import React from "react";

import Achievement from "./Achievement";
import Word from "./Word";
import * as icons from "@/constants/icons";

const Table = () => {
  return (
    <View className="h-full w-11/12 border rounded-xl border-grayscale-400 flex-column items-center justify-start">
      {/* odkomentirani achievementi da se vidi kako izgleda */}
      <Achievement
        title="A Motivational Beginning"
        description="Learn your first 3 letters"
        completed={true}
        icon={true ? icons.confetti : icons.confettiBW}
      />
      <View className="h-[1px] bg-grayscale-400 w-full" />
      <Achievement
        title="Busy learnin'"
        description="Spend 10 hours learning sign language"
        completed={false}
        icon={false ? icons.studying : icons.studyingBW}
      />
      {/* <Word word="mom" />
      <View className="h-[1px] bg-grayscale-400 w-full" />
      <Word word="dad" />
      <View className="h-[1px] bg-grayscale-400 w-full" />
      <Word word="apple" />
      <View className="h-[1px] bg-grayscale-400 w-full" />
      <Word word="banana" /> */}
    </View>
  );
};

export default Table;
