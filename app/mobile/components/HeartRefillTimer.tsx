import React, { useState, useEffect } from "react";
import { Text } from "react-native";

interface HeartRefillTimerProps {
  refillTimestamp: string | null;
}

const HeartRefillTimer = ({ refillTimestamp }: HeartRefillTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!refillTimestamp) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const refillTime = new Date(refillTimestamp);

      // If refill time is in the past, no need to show timer
      if (refillTime <= now) {
        setTimeRemaining("");
        return;
      }

      // Calculate time difference in milliseconds
      const diffMs = refillTime.getTime() - now.getTime();

      // Convert to hours, minutes, seconds
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      // Format time string
      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    // Update immediately
    updateTimer();

    // Set interval to update every second
    const intervalId = setInterval(updateTimer, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refillTimestamp]);

  if (!timeRemaining) return null;

  return (
    <Text className="text-error text-xs font-interMedium mt-1">
      {timeRemaining}
    </Text>
  );
};

export default HeartRefillTimer;
