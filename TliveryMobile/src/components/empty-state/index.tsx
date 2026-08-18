import type {FC, ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Card from '@app/components/card';
import Column from '@app/components/column';
import WaselMark from '@app/components/wasel-mark';
import {fontSize, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getWidth} from '@app/utils/responsive-design';

type EmptyStateProps = {
  illustration?: ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'gold';
};

const EmptyState: FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  actionTitle,
  onAction,
  actionVariant = 'gold',
}) => (
  <Card style={styles.card}>
    <Column gap={space.sm} style={styles.inner}>
      <View style={styles.art}>{illustration ?? <WaselMark size={72} />}</View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.body} tone="secondary">
        {description}
      </AppText>
      {actionTitle && onAction ? (
        <AppButton
          title={actionTitle}
          variant={actionVariant}
          onPress={onAction}
        />
      ) : null}
    </Column>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    width: '100%',
  },
  art: {
    marginBottom: getWidth(space.xs),
  },
  title: {
    fontSize: fontSize.cardTitle,
    textAlign: 'center',
    ...cairoFont('medium'),
  },
  body: {
    fontSize: fontSize.body,
    textAlign: 'center',
    lineHeight: fontSize.body + 6,
  },
});

export default EmptyState;
