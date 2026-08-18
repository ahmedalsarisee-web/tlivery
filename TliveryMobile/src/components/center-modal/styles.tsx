import {StyleSheet} from "react-native";
import {ThemeType} from "@app/theme/theme";
import {LangDirection} from "@app/enums/LangDirection";
import {getWidth, moderateScale} from "@app/utils/responsive-design";
import {getTextAlign} from "@app/utils/directionalStyles";
import {cairoFont} from "@app/theme/fonts";

export const centerModalStyles = (theme: ThemeType, direction: LangDirection) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.ui.backdrop,
      alignItems: "center",
      justifyContent: "center",
      padding: getWidth(24),
    },

    cardWrap: {
      width: "100%",
      maxWidth: getWidth(420),
    },

    cardFill: {
      width: "100%",
    },
    title: {
      color: theme.typography.primary,
      fontSize: moderateScale(18),
      ...cairoFont("bold"),
      textAlign: getTextAlign(direction),
    },
  });
