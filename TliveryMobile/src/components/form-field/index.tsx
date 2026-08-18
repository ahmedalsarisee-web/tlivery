import {FC} from "react";
import {StyleSheet, View} from "react-native";
import {getHeight} from "@app/utils/responsive-design";
import AppText from "@app/components/app-text";
import {FormFieldProps} from "@app/types/formField.props";

const FormField: FC<FormFieldProps> = ({
  children,
  label,
  error,
  hint,
  required = false,
  style,
}) => (
  <View style={[styles.container, style]}>
    {label ? (
      <AppText variant="label">
        {label}
        {required ? (
          <AppText variant="label" tone="error">
            {" *"}
          </AppText>
        ) : null}
      </AppText>
    ) : null}

    {children}

    {error ? (
      <AppText variant="caption" tone="error">
        {error}
      </AppText>
    ) : hint ? (
      <AppText variant="caption" tone="secondary">
        {hint}
      </AppText>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: getHeight(4),
  },
});

export default FormField;
