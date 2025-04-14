import {
  CameraView,
  CameraType,
  useCameraPermissions,
  CameraCapturedPicture,
} from "expo-camera";
import { useRef, useState } from "react";
import { Button, Text, TouchableOpacity, View, Image } from "react-native";

import * as icons from "@/constants/icons";

interface CameraComponentProps {
  onSavePhoto: (photo: CameraCapturedPicture) => void;
  onCloseCamera: () => void;
}

export default function CameraComponent({
  onSavePhoto,
  onCloseCamera,
}: CameraComponentProps) {
  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null); // To store the picture URI
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  let camera: CameraView | null = null;

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 justify-center">
        <Text className="text-center pb-2">
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function takePicture() {
    console.log("Taking picture...");
    if (camera) {
      const photo = await camera.takePictureAsync({
        quality: 1,
        base64: true,
      });
      if (!photo) {
        console.error("No photo taken");
        return;
      }
      setPhoto(photo);
      console.log(photo.uri);
    }
  }

  const retakePicture = () => {
    setPhoto(null);
  };

  const savePicture = () => {
    if (photo) {
      onSavePhoto(photo);
      // Close the camera view
      onCloseCamera();
      setPhoto(null);
    }
  };

  return (
    <View className="w-full h-full z-10">
      <CameraView
        style={{
          width: "100%",
          height: "400",
          zIndex: 20,
          paddingBottom: 20,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
        facing={facing}
        ref={(r) => {
          camera = r;
        }}
        onCameraReady={() => setCameraReady(true)}
      >
        <TouchableOpacity
          className="w-16 h-16 z-50 rounded-full bg-white border-2 border-grayscale-500/50"
          onPress={takePicture}
        />
      </CameraView>
    </View>
  );
}
