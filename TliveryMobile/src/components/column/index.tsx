import {useMemo, FC} from "react";
import {View, ViewStyle} from "react-native";
import {getHeight} from "@app/utils/responsive-design";
import {ColumnProps} from "@app/types/column.props";

const Column: FC<ColumnProps> = ({
  gap,
  align,
  justify,
  flex,
  style,
  children,
  ...rest
}) => {
  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: "column",
      ...(align ? {alignItems: align} : null),
      ...(justify ? {justifyContent: justify} : null),
      ...(gap != null ? {gap: getHeight(gap)} : null),
      ...(flex != null ? {flex} : null),
    }),
    [align, justify, gap, flex],
  );

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
};

export default Column;
