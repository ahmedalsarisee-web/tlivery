import {useMemo, FC} from "react";
import {View, ViewStyle} from "react-native";
import {useLanguage} from "@app/providers/LangContext";
import {getFlexDirection} from "@app/utils/directionalStyles";
import {getWidth} from "@app/utils/responsive-design";
import {RowProps} from "@app/types/row.props";

const Row: FC<RowProps> = ({
  gap,
  align = "center",
  justify = "flex-start",
  wrap = false,
  flex,
  style,
  children,
  ...rest
}) => {
  const {direction} = useLanguage();
  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: getFlexDirection(direction),
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap ? "wrap" : "nowrap",
      ...(gap != null ? {gap: getWidth(gap)} : null),
      ...(flex != null ? {flex} : null),
    }),
    [direction, align, justify, wrap, gap, flex],
  );

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
};

export default Row;
