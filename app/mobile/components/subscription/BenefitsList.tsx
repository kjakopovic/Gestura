import { View, Text } from "react-native";
import React from "react";
import { ImageSourcePropType } from "react-native";
import Benefit from "./Benefit";

type BenefitItem = {
  text: string;
  icon: ImageSourcePropType;
};

type BenefitCategory = {
  title: string;
  titleClass: string;
  benefits: BenefitItem[];
};

type BenefitsListProps = {
  categories: BenefitCategory[];
};

const BenefitsList = ({ categories }: BenefitsListProps) => {
  return (
    <View>
      <View className="flex flex-col justify-start items-center w-full border-2 border-grayscale-400 rounded-xl mb-8">
        {categories.map((category, categoryIndex) => (
          <React.Fragment key={`category-${categoryIndex}`}>
            {categoryIndex > 0 && (
              <View className="w-full h-1 border-b-2 border-grayscale-400"></View>
            )}
            <View className="flex flex-col justify-center items-start w-full">
              <View className="flex flex-row justify-start items-center w-full">
                <Text
                  className={`${category.titleClass} font-interBold text-base px-2 mx-4 border-b-2 border-l-2 border-r-2 rounded-b-xl border-grayscale-400`}
                >
                  {category.title}
                </Text>
              </View>

              {category.benefits.map((benefit, index) => (
                <Benefit
                  key={`benefit-${categoryIndex}-${index}`}
                  text={benefit.text}
                  icon={benefit.icon}
                />
              ))}
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default BenefitsList;
