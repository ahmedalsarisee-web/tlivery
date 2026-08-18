import type {FC} from 'react';
import {useTranslation} from 'react-i18next';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import Column from '@app/components/column';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

const ComingSoonScreen: FC<Props> = () => {
  const {t} = useTranslation();

  return (
    <ScreenContainer navTitle={t('navReports')}>
      <Card>
        <Column gap={8}>
          <AppText variant="subtitle">{t('navReports')}</AppText>
          <AppText variant="body" tone="secondary">
            {t('sectionComingSoon')}
          </AppText>
        </Column>
      </Card>
    </ScreenContainer>
  );
};

export default ComingSoonScreen;
