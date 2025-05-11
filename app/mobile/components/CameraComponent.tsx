import React, { useState, useRef } from "react";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  CameraCapturedPicture,
} from "expo-camera";
import { Button, Text, TouchableOpacity, View, Image } from "react-native";
import { MODEL_IMAGE_SIZE } from "@/constants/model";

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
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const cameraRef = useRef<CameraView | null>(null);

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

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
      });
      if (!photo) {
        console.error("No photo taken");
        return;
      }
      setPhoto(photo);
      onSavePhoto(photo);
    }
  }

  const retakePicture = () => {
    setPhoto(null);
  };

  return (
    <View className="w-full items-center flex z-10">
      {photo ? (
        <View className="relative" style={{ height: 224, width: 224 }}>
          <Image
            source={{ uri: photo.uri }}
            className="w-full h-full rounded-xl"
            style={{ resizeMode: "cover" }}
          />
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-4 px-4">
            <TouchableOpacity
              className="bg-red-500 px-4 py-2 rounded-md"
              onPress={retakePicture}
            >
              <Text className="text-white font-bold">Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-500 px-4 py-2 rounded-md"
              onPress={onCloseCamera}
            >
              <Text className="text-white font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <CameraView
          style={{
            width: 224,
            height: 224,
            zIndex: 20,
            paddingBottom: 20,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
          pictureSize={`${MODEL_IMAGE_SIZE[0]}x${MODEL_IMAGE_SIZE[1]}`}
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setCameraReady(true)}
        >
          <View className="w-full flex-row justify-between px-8 pb-4">
            <TouchableOpacity
              className="bg-gray-700/50 p-2 rounded-full"
              onPress={onCloseCamera}
            >
              <Text className="text-white">✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-16 h-16 z-50 rounded-full bg-white border-2 border-grayscale-500/50"
              onPress={takePicture}
            />
            <TouchableOpacity
              className="bg-gray-700/50 p-2 rounded-full"
              onPress={() => setFacing(facing === "front" ? "back" : "front")}
            >
              <Text className="text-white">⟳</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}
