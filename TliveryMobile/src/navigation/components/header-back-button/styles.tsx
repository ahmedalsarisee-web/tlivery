import {StyleSheet} from "react-native";
import {ThemeType} from "@app/theme/theme";
import {LangDirection} from "@app/enums/LangDirection";
import {moderateScale} from "@app/utils/responsive-design";
import {getScaleX} from "@app/utils/directionalStyles";

export const headerBackButtonStyles = (
  theme: ThemeType,
  direction: LangDirection,
) =>
  StyleSheet.create({
    container: {
      padding: moderateScale(4),

      ...getScaleX(direction),
    },
  });
