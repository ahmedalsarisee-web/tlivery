import {StyleSheet} from "react-native";
import {ThemeType} from "@app/theme/theme";
import {getWidth, moderateScale} from "@app/utils/responsive-design";

export const TRACK_W = getWidth(48);
export const TRACK_H = moderateScale(28);
const PAD = moderateScale(3);
export const THUMB = TRACK_H - PAD * 2;
export const TRAVEL = TRACK_W - THUMB - PAD * 2;

export const toggleStyles = (theme: ThemeType) =>
  StyleSheet.create({
    track: {
      width: TRACK_W,
      height: TRACK_H,
      borderRadius: TRACK_H / 2,
      padding: PAD,
      justifyContent: "center",
    },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: theme.base.white,
    },
    disabled: {
      opacity: 0.5,
    },
  });
