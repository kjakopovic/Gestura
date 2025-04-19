import { ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import Table from "@/components/profile/Table";
import Achievement from "@/components/profile/Achievement";
import Word from "@/components/profile/Word";

import * as icons from "@/constants/icons";

const Profile = () => {
  return (
    <ScrollView className="bg-grayscale-800">
      <SafeAreaView className="flex-1 items-center justify-start">
        <Table>
          <Achievement
            title="A Motivational Beginning"
            description="Learn your first 3 letters"
            completed={true}
            icon={icons.confetti}
          />
          <Achievement
            title="Busy learnin'"
            description="Spend 10 hours learning sign language"
            completed={false}
            icon={icons.studying}
          />
          <Word word="mom" />
        </Table>
      </SafeAreaView>
    </ScrollView>
  );
};

export default Profile;
