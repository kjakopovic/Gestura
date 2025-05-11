// import { View, Text, Image } from "react-native";
// import React from "react";
// import CustomButton from "@/components/CustomButton";

// import { useRouter } from "expo-router";

// const Talker = () => {
//   const router = useRouter();

//   return (
//     <View className="flex-1 items-center justify-center bg-grayscale-800">
//       <Text className="text-white text-xl font-interExtraBold mb-8">
//         The person is now talking.
//       </Text>
//       {/* TODO: ovdje ide kamera */}
//       <View className="flex flex-col justify-center items-center border-2 border-grayscale-400 w-96 h-96 mt-4 rounded-xl" />
//       <View className="flex flex-row justify-start items-start w-full px-12 py-4">
//         <Image source={handSigns.letter_a} className="size-12" />
//         <Image source={handSigns.letter_l} className="size-12" />
//         <Image source={handSigns.letter_o} className="size-12" />
//         <Image source={handSigns.letter_v} className="size-12" />
//       </View>
//       <CustomButton
//         text="SWITCH TO SIGNER"
//         style="base"
//         onPress={() => router.push("/(root)/(premium-options)/Signer")}
//       />
//       <CustomButton
//         text="CLOSE TRANSLATOR"
//         style="error"
//         onPress={() => router.push("/(root)/(tabs)/Premium")}
//       />
//     </View>
//   );
// };

// export default Talker;
