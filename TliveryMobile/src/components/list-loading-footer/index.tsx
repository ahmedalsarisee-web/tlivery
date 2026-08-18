import {useMemo, type FC} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {getHeight} from '@app/utils/responsive-design';
import {space} from '@app/theme/tokens';

type ListLoadingFooterProps = {
  visible: boolean;
};

const ListLoadingFooter: FC<ListLoadingFooterProps> = ({visible}) => {
  const {theme} = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingVertical: getHeight(space.sm),
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.brand.gold} />
    </View>
  );
};

export default ListLoadingFooter;
