import { icons } from "@/constants/icons";

export enum SideBarOptions {
  HOME = "Home",
  CREATE_ROOM = "Create Room",
  JOIN_ROOM = "Join Room",
  INVITE_FRIENDS = "Invite Friends",
  LOGOUT = "Log out",
}

export const options = [
  {
    icon: icons.home_2,
    label: SideBarOptions.HOME,
  },
  {
    icon: icons.create,
    label: SideBarOptions.CREATE_ROOM,
  },
  {
    icon: icons.join,
    label: SideBarOptions.JOIN_ROOM,
  },
  {
    icon: icons.invite,
    label: SideBarOptions.INVITE_FRIENDS,
  },
];
