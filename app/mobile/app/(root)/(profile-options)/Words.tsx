import React from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import CustomAppBar from "@/components/CustomAppBar";
import LineProgressIndicator from "@/components/progress_indicators/LineProgressIndicator";
import SettingSubtitle from "@/components/settings/SettingSubtitle";
import LetterCompletion from "@/components/profile/LetterCompletion";
import { useUserStore } from "@/store/useUserStore";
import Table from "@/components/profile/Table";
import Word from "@/components/profile/Word";

const Words = () => {
  const userData = useUserStore((state) => state.user);

  const lettersLearned = userData?.letters_learned || {};

  const usaLetters = lettersLearned.usa || [];

  const uppercaseLetters = usaLetters.map((letter: string) =>
    letter.toUpperCase()
  );

  const progress = (usaLetters.length / 26) * 100;

  // Array of words to display in the table
  const wordsList = [
    "HELLO",
    "THANK YOU",
    "PLEASE",
    "SORRY",
    "GOODBYE",
    "YES",
    "NO",
  ];

  return (
    <>
      <CustomAppBar title="WORDS" backButton />
      <ScrollView
        className="bg-grayscale-800 mt-24 px-10"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <View className="flex-1 justify-center items-start mt-14">
            <SettingSubtitle title="LETTERS" />
            <LineProgressIndicator progress={progress} style="progress" />
            <LetterCompletion
              completedLetters={uppercaseLetters}
              classname="mt-5"
            />
            <View className="mt-5">
              <SettingSubtitle title="WORDS" />
              <Table>
                {wordsList.map((word, index) => (
                  <Word
                    key={index}
                    word={word}
                    noBorder={index === wordsList.length - 1}
                  />
                ))}
              </Table>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Words;
