import { View, Text, ScrollView } from "react-native";
import React from "react";
import CircularProgressIndicator from "@/components/progress_indicators/CircularProgressIndicator";
import LineProgressIndicator from "@/components/progress_indicators/LineProgressIndicator";

const Profile = () => {
  return (
    <ScrollView className="bg-grayscale-800">
      <Text>Profile</Text>
      <CircularProgressIndicator
        style="primary"
        type="Battlepass"
        level={5}
        progress={50}
      />
      <CircularProgressIndicator
        style="secondary"
        type="Your"
        level={10}
        progress={75}
      />
      <LineProgressIndicator style="xp" progress={50} />
      <LineProgressIndicator style="progress" progress={75} />
    </ScrollView>
  );
};

export default Profile;
