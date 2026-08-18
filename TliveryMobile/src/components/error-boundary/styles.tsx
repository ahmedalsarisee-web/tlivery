import {StyleSheet} from "react-native";
import {ThemeType} from "@app/theme/theme";
import {getHeight, getWidth, moderateScale} from "@app/utils/responsive-design";

export const errorFallbackStyles = (theme: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.backgrounds.background,
      paddingHorizontal: getWidth(24),
      gap: getHeight(12),
    },
    title: {
      textAlign: "center",
    },
    message: {
      textAlign: "center",
      marginBottom: getHeight(8),
    },
    detail: {
      textAlign: "center",
    },
    button: {
      marginTop: getHeight(8),
      minWidth: getWidth(160),
    },
    icon: {
      fontSize: moderateScale(40),
      marginBottom: getHeight(4),
    },
  });
