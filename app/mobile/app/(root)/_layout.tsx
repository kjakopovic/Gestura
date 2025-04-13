import { Stack } from "expo-router";

const PostLoginLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="task" options={{ headerShown: false }} />
    </Stack>
  );
};

export default PostLoginLayout;
