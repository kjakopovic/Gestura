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

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get<InventoryApiResponse>("/inventory", {
        apiBase: "inventory",
      });

      if (response.success && response.data) {
        // Save to store
        setInventoryFromApi(response.data);
        console.log("Inventory data loaded into store:", response.data);
      } else {
        setError("Failed to fetch inventory");
        console.error("Error fetching inventory data:", response.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const activateItem = async (itemId: string) => {
    try {
      console.log("Activating item with ID:", itemId);
      setActivating(true);
      const response = await api.post(
        "/items/consume?item_id=" + itemId,
        {},
        {
          apiBase: "inventory",
        }
      );

      if (!response.success) {
        //@ts-ignore
        if (response.error?.status === 400) {
          Alert.alert(
            "Oops",
            "Looks like you can't use this right now!",
            [{ text: "OK" }],
            {
              cancelable: false,
            }
          );
          return;
        }
        console.error("Error activating item:", response.error);
        return;
      }

      Alert.alert(
        "Item Activated",
        "You have successfully activated the item.",
        [
          {
            text: "OK",
            onPress: () => {
              // Optionally, you can refresh the inventory after activation
              fetchInventory();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error activating item:", errorMessage);
    } finally {
      setActivating(false);
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
        <Text className="text-xl text-grayscale-100 font-interBold mt-16">
          ITEMS
        </Text>
        {items.map((item) => (
          <Item
            key={item.id}
            itemTitle={item.name}
            icon={item.image_url}
            category={item.category}
            onPress={() => activateItem(item.id)}
          />
        ))}

        <Text className="text-xl text-grayscale-100 font-interBold mt-16">
          BATTLE PASS
        </Text>
        <BPRewards unclaimedRewards={userBattlepass.unlocked_levels.length} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Inventory;
