import { View } from "react-native";
import React from "react";

type TableProps = {
  children: React.ReactElement[];
};

const Table = ({ children }: TableProps) => {
  return (
    <View className="h-full w-11/12 border rounded-xl border-grayscale-400 flex-column items-center justify-start">
      {children.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < children.length - 1 && (
            <View className="h-[1px] bg-grayscale-400 w-full" />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

export default Table;
