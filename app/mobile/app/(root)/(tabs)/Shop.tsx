import {
  Text,
  ScrollView,
  View,
  Image,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import React, { useState } from "react";

import ShopOption from "@/components/shop/ShopOption";
import ChestOption from "@/components/shop/ChestOption";
import CoinsOption from "@/components/shop/CoinsOption";
import PurchaseModal from "@/components/shop/PurchaseModal";

import * as icons from "@/constants/icons";

const Shop = () => {
  let userCoins = 20;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState({ type: "", price: 0 });

  const handlePurchase = (itemType: string, price: number) => {
    setSelectedItem({ type: itemType, price: price });
    setModalVisible(true);
  };

  return (
    <SafeAreaView className=" flex-1 bg-grayscale-800">
      <PurchaseModal
        visible={modalVisible}
        setVisible={setModalVisible}
        item={selectedItem}
        price={selectedItem.price}
        userCoins={userCoins}
      />
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="w-full flex flex-col items-center justify-start">
          <View className="w-full flex flex-row items-center justify-center my-10">
            <Image source={icons.coin} className="h-10 w-10" />
            <Text className="text-primary text-4xl font-interBold m-2">
              {userCoins}
            </Text>
          </View>
          {/* ITEMS */}
          <View className="w-full flex flex-col items-center justify-start mb-10">
            <Text className="text-grayscale-100 text-2xl font-interExtraBold">
              ITEMS
            </Text>
            <View className="w-full flex flex-row items-center justify-between px-12 m-8">
              <ShopOption
                type="hearts"
                price={100}
                borderless={false}
                onPress={() => handlePurchase("hearts", 100)}
              />
              <ShopOption type="xp" price={200} borderless={false} />
            </View>
            <View className="w-full flex flex-row items-center justify-between px-12">
              <ShopOption type="hearts" price={100} borderless={false} />
              <ShopOption type="xp" price={200} borderless={false} />
            </View>
          </View>
          {/* COINS */}
          <View className="w-full flex flex-col items-center justify-start">
            <Text className="text-grayscale-100 text-2xl font-interExtraBold">
              COINS
            </Text>
            <View className="w-full flex flex-row items-center justify-between px-12 m-8">
              <CoinsOption type="handful" price={0.99} amount="1000" />
              <CoinsOption type="bag" price={3.99} amount="10K" />
            </View>
          </View>

          {/* CHESTS */}
          <View className="w-full flex flex-col items-center justify-center">
            <Text className="text-grayscale-100 text-2xl font-interExtraBold">
              CHESTS
            </Text>
            <View className="w-full flex flex-row items-center justify-center m-8">
              <ChestOption chestPrice={1000} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Shop;
