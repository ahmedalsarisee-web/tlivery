import {useMemo, FC} from "react";
import {Modal, Pressable, Text} from "react-native";
import {useTheme} from "@app/providers/ThemeContext";
import {useLanguage} from "@app/providers/LangContext";
import Card from "@app/components/card";
import {CenterModalProps} from "@app/types/centerModal.props";
import {centerModalStyles} from "./styles";

const CenterModal: FC<CenterModalProps> = ({
  visible,
  onClose,
  children,
  title,
  dismissOnBackdrop = true,
  cardStyle,
}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => centerModalStyles(theme, direction),
    [theme, direction],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={dismissOnBackdrop ? onClose : undefined}
      >
        {}
        <Pressable onPress={() => {}} style={[styles.cardWrap, cardStyle]}>
          <Card style={styles.cardFill}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {children}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CenterModal;
