import {useMemo, FC} from "react";
import {View} from "react-native";
import {useTranslation} from "react-i18next";
import {useTheme} from "@app/providers/ThemeContext";
import AppText from "@app/components/app-text";
import AppButton from "@app/components/app-button";
import {ErrorFallbackProps} from "@app/types/errorBoundary.props";
import {errorFallbackStyles} from "./styles";

const ErrorFallback: FC<ErrorFallbackProps> = ({error, onReset}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const styles = useMemo(() => errorFallbackStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <AppText style={styles.icon}>⚠️</AppText>
      <AppText variant="heading" style={styles.title}>
        {t("errorTitle")}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.message}>
        {t("errorMessage")}
      </AppText>
      {__DEV__ && error?.message ? (
        <AppText variant="caption" tone="error" style={styles.detail}>
          {error.message}
        </AppText>
      ) : null}
      <View style={styles.button}>
        <AppButton title={t("tryAgain")} onPress={onReset} />
      </View>
    </View>
  );
};

export default ErrorFallback;
