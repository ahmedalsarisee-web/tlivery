import {useMemo, FC} from "react";
import {StyleSheet, Text, type TextStyle} from "react-native";
import {useTheme} from "@app/providers/ThemeContext";
import {useLanguage} from "@app/providers/LangContext";
import {AppTextProps, defaultAppTextTone} from "@app/types/appText.props";
import {cairoFont, resolveFontWeight} from "@app/theme/fonts";
import {appTextStyles} from "./styles";

const AppText: FC<AppTextProps> = ({
  variant = "body",
  tone,
  style,
  children,
  ...rest
}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => appTextStyles(theme, direction),
    [theme, direction],
  );

  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const overrideFont =
    flattened?.fontWeight != null || flattened?.fontFamily != null
      ? cairoFont(resolveFontWeight(flattened?.fontWeight))
      : null;
  const cleanedStyle: TextStyle | undefined = flattened
    ? (() => {
        const next = {...flattened};
        delete next.fontWeight;
        delete next.fontFamily;
        return next;
      })()
    : undefined;

  return (
    <Text
      maxFontSizeMultiplier={1.15}
      style={[
        styles.base,
        styles[variant],
        styles[tone ?? defaultAppTextTone[variant]],
        cleanedStyle,
        overrideFont,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default AppText;
