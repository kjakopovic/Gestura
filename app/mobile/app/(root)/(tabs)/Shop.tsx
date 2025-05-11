import {
  Text,
  ScrollView,
  View,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import React from "react";

import ShopOption from "@/components/shop/ShopOption";
import ChestOption from "@/components/shop/ChestOption";
import CoinsOption from "@/components/shop/CoinsOption";
import PurchaseModal from "@/components/shop/PurchaseModal";
import { useShopData } from "@/hooks/useShopData";
import { usePurchase } from "@/hooks/usePurchase";
import { ShopItem } from "@/types/shop";

import * as icons from "@/constants/icons";
import CustomAppBar from "@/components/CustomAppBar";

const Shop = () => {
  const { loading, shopItems, coins, chests } = useShopData();
  const {
    purchasing,
    modalVisible,
    setModalVisible,
    selectedItem,
    purchaseMessage,
    userCoins,
    handlePurchase,
    completePurchase,
  } = usePurchase();

  return (
    <>
      <CustomAppBar title="SHOP" />
      <SafeAreaView className="flex-1 bg-grayscale-800">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator
              size="large"
              color="#A162FF"
              className="w-1/2 h-1/2"
            />
          </View>
        ) : (
          <>
            <PurchaseModal
              purchasing={purchasing}
              visible={modalVisible}
              setVisible={setModalVisible}
              item={selectedItem}
              price={selectedItem?.price}
              userCoins={userCoins}
              message={purchaseMessage}
              onPurchase={completePurchase}
            />
            <ScrollView
              className="flex-1 w-full mt-20"
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              <View className="w-full flex flex-col items-center justify-start">
                {/* User's Coins Display */}
                <View className="w-full flex flex-row items-center justify-center mt-24 mb-8">
                  <Image source={icons.coin} className="h-10 w-10" />
                  <Text className="text-primary text-4xl font-interBold m-2">
                    {userCoins}
                  </Text>
                </View>
                <View className="w-full flex-row items-center justify-center">
                  <View className="w-[95%]">
                    {/* Shop Items Section */}
                    <ShopSection
                      title="ITEMS"
                      items={shopItems}
                      renderItem={(item: ShopItem) => (
                        <ShopOption
                          key={item.id}
                          title={item.name}
                          type={item.category}
                          price={item.price}
                          borderless={false}
                          onPress={() => handlePurchase(item)}
                        />
                      )}
                    />
                    {/* Coins Section */}
                    <ShopSection
                      title="COINS"
                      items={coins}
                      renderItem={(coin: ShopItem) => (
                        <CoinsOption
                          key={coin.id}
                          type={
                            coin.name.includes("Handful") ? "handful" : "bag"
                          }
                          price={coin.price}
                          amount={
                            coin.name.includes("Handful") ? "1000" : "10K"
                          }
                        />
                      )}
                    />
                    {/* Chests Section */}
                    <ShopSection
                      title="CHESTS"
                      items={chests}
                      renderItem={(chest: ShopItem) => (
                        <ChestOption
                          key={chest.id}
                          chestPrice={chest.price}
                          onPress={() => handlePurchase(chest)}
                        />
                      )}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </>
  );
};

// Helper component for shop sections
const ShopSection = ({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: ShopItem[];
  renderItem: (item: ShopItem) => React.ReactNode;
}) => (
  <View className="w-full flex flex-col items-center justify-start mb-10">
    <Text className="text-grayscale-100 text-2xl font-interExtraBold pb-3">
      {title}
    </Text>
    <View className="w-full h-auto flex flex-wrap flex-row gap-5 items-center justify-center">
      {items.map(renderItem)}
    </View>
  </View>
);

export default Shop;
