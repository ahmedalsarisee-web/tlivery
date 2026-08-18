import {useMemo, FC} from "react";
import {Pressable} from "react-native";
import {useNavigation} from "@react-navigation/native";
import Svg, {Path} from "react-native-svg";
import {useTranslation} from "react-i18next";
import {useTheme} from "@app/providers/ThemeContext";
import {useLanguage} from "@app/providers/LangContext";
import {headerBackButtonStyles} from "./styles";

const HeaderBackButton: FC = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const styles = useMemo(
    () => headerBackButtonStyles(theme, direction),
    [theme, direction],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("back")}
      hitSlop={12}
      onPress={() => navigation.goBack()}
      style={styles.container}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15 18l-6-6 6-6"
          stroke={theme.typography.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
};

export default HeaderBackButton;
