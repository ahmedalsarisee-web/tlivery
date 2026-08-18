import {useMemo, FC} from "react";
import {Pressable, View} from "react-native";
import {useTheme} from "@app/providers/ThemeContext";
import {CardProps} from "@app/types/card.props";
import {cardStyles} from "./styles";

const Card: FC<CardProps> = ({children, style, onPress, ...rest}) => {
  const {theme} = useTheme();
  const styles = useMemo(() => cardStyles(theme), [theme]);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [styles.card, pressed && styles.pressed, style]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

export default Card;
