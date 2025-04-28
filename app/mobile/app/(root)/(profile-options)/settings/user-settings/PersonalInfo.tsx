import React, { useState, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAppBar from "@/components/CustomAppBar";
import ProfileImage from "@/components/personal_info/ProfileImage";
import * as characters from "@/constants/characters";
import ProfileInfoItem from "@/components/personal_info/ProfileInfoItem";
import CustomButton from "@/components/CustomButton";

const PersonalInfo = () => {
  const [originalProfile, setOriginalProfile] = useState({
    name: "John Doe",
    username: "johndoe123",
    email: "jon@doe.com",
    phone: "+1234567890",
    subscription: "Live",
  });

  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    username: "johndoe123",
    email: "jon@doe.com",
    phone: "+1234567890",
    subscription: "Live",
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes whenever userProfile is updated
  useEffect(() => {
    const profileChanged =
      JSON.stringify(userProfile) !== JSON.stringify(originalProfile);
    setHasChanges(profileChanged);
  }, [userProfile, originalProfile]);

  const saveChanges = () => {
    // Here you would typically save to a backend
    setOriginalProfile({ ...userProfile });
    setHasChanges(false);
    // You might want to add a success message or notification here
  };

  return (
    <>
      <CustomAppBar title="PERSONAL INFO" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1 items-center justify-center">
          <ProfileImage
            character={characters.profileCharacterFace}
            backgroundColor="#FF5733"
          />
          <View className="flex w-full flex-col items-center justify-center mt-8">
            <ProfileInfoItem
              name="Name"
              value={userProfile.name}
              onChange={(value) =>
                setUserProfile({ ...userProfile, name: value })
              }
            />
            <ProfileInfoItem
              name="Username"
              value={userProfile.username}
              onChange={(value) =>
                setUserProfile({ ...userProfile, username: value })
              }
            />
            <ProfileInfoItem
              name="Email"
              value={userProfile.email}
              onChange={(value) =>
                setUserProfile({ ...userProfile, email: value })
              }
            />
            <ProfileInfoItem
              name="Phone"
              value={userProfile.phone}
              onChange={(value) =>
                setUserProfile({ ...userProfile, phone: value })
              }
            />
            <ProfileInfoItem
              name="Subscription"
              value={userProfile.subscription}
              onChange={(value) =>
                setUserProfile({ ...userProfile, subscription: value })
              }
              disabled={true}
            />

            {hasChanges && (
              <View className="w-full mt-4">
                <CustomButton
                  text="SAVE CHANGES"
                  style="success"
                  onPress={saveChanges}
                  noMargin
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default PersonalInfo;
