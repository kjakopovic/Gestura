import {
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useCallback, useState } from "react";
import Item from "@/components/inventory/Item";
import BPRewards from "@/components/inventory/BPRewards";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { InventoryApiResponse } from "@/types/types";
import { useInventoryStore } from "@/store/useInventoryStore";
import CustomAppBar from "@/components/CustomAppBar";

const Inventory = () => {
  // Get store actions
  const setInventoryFromApi = useInventoryStore(
    (state) => state.setInventoryFromApi
  );
  const setLoading = useInventoryStore((state) => state.setLoading);
  const setError = useInventoryStore((state) => state.setError);
  const [activating, setActivating] = React.useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Get store state
  const { items, userBattlepass, isLoading, error } = useInventoryStore();

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<InventoryApiResponse>("/inventory", {
        apiBase: "inventory",
      });

      if (response.success && response.data) {
        setInventoryFromApi(response.data);
      } else {
        setError("Failed to fetch inventory");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setInventoryFromApi, setLoading, setError]);

  const activateItem = async (
    itemId: string,
    itemCategory?: string
  ): Promise<number | undefined> => {
    // Only set global activating state for non-chest items,
    // as chests have their own button loading state in Item.tsx
    if (itemCategory !== "chest") {
      setActivating(true);
    }
    try {
      const response = await api.post<{
        message: string;
        won_item?: { coins: number; win_percentage: number };
      }>(
        "/items/consume?item_id=" + itemId,
        {},
        {
          apiBase: "inventory",
        }
      );

      if (!response.success) {
        //@ts-ignore
        if (response.error?.status === 400) {
          Alert.alert("Oops", "Looks like you can't use this right now!");
        } else {
          Alert.alert("Error", "Failed to activate item. Please try again.");
        }
        return undefined;
      }

      if (itemCategory !== "chest") {
        Alert.alert(
          "Item Activated",
          response.data?.message || "You have successfully activated the item.",
          [
            {
              text: "OK",
              onPress: () => {
                fetchInventory();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // For chests, log success, but don't show a disruptive alert here.
        console.log(
          "Inventory.tsx: Chest consumption API call successful:",
          response.data?.message
        );
      }

      if (
        response.data?.won_item &&
        typeof response.data.won_item.coins === "number"
      ) {
        console.log(
          "Inventory.tsx (activateItem): Returning coins:",
          response.data.won_item.coins
        ); // DEBUG
        return response.data.won_item.coins;
      }
      console.log(
        "Inventory.tsx (activateItem): No coins in won_item or not a number, returning undefined."
      ); // DEBUG
      return undefined;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to activate item: ${errorMessage}`);
      console.error(
        "Inventory.tsx (activateItem): Error during API call:",
        error
      ); // DEBUG
      return undefined;
    } finally {
      // Only unset global activating state if it was set for non-chest items
      if (itemCategory !== "chest") {
        setActivating(false);
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInventory().finally(() => setRefreshing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || activating) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-grayscale-800">
        <ActivityIndicator
          size="large"
          color="#A162FF"
          className="mt-16"
          style={{ transform: [{ translateY: -50 }] }}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-grayscale-800">
        <Text className="text-xl text-grayscale-100 font-interBold mt-16">
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <CustomAppBar title="INVENTORY" />
      <SafeAreaView className="flex-1 items-center justify-center bg-grayscale-800">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="w-full p-2 px-5"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#A162FF"]} // Match your theme color
              tintColor="#A162FF"
              title="Refreshing inventory..."
              titleColor="#FFFFFF"
            />
          }
        >
          <Text className="text-xl text-grayscale-100 font-interBold mt-24">
            ITEMS
          </Text>
          {items.length === 0 && (
            <Text className="text-lg text-center text-grayscale-100 font-interBold mt-16">
              No items available
            </Text>
          )}
          {items.map((item) => (
            <Item
              key={item.id}
              itemId={item.id} // Pass itemId
              itemTitle={item.name}
              icon={item.image_url}
              category={item.category}
              onPress={activateItem} // Pass activateItem directly
              fetchInventory={fetchInventory} // Pass fetchInventory
            />
          ))}

          <Text className="text-xl text-grayscale-100 font-interBold mt-16">
            BATTLE PASS
          </Text>
          <BPRewards unclaimedRewards={userBattlepass.unlocked_levels.length} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default Inventory;
