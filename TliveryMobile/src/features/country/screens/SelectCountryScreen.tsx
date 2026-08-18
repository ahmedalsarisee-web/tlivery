import {useMemo, useState, type FC} from 'react';
import {FlatList, Pressable, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Check} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import type {CountryIso} from '@app/config/countries';
import type {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import {selectCountryStyles} from './SelectCountry.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SelectCountry'>;
type SelectCountryRoute = RouteProp<RootStackParamList, 'SelectCountry'>;

const SelectCountryScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SelectCountryRoute>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const {countries, countryIso, setCountry, hasSelectedCountry} = useCountry();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => selectCountryStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );
  const isChange = route.params?.mode === 'change';
  const [selected, setSelected] = useState<CountryIso>(countryIso);
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  const onContinue = () => {
    setCountry(selected);
    if (isChange || hasSelectedCountry) {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
    }
    navigation.reset({index: 0, routes: [{name: 'Splash'}]});
  };

  return (
    <ScreenContainer
      withNavHeader={isChange}
      navVariant="page"
      navTitle={t('selectCountryTitle')}
      keyboardAvoiding={false}
      scrollable={false}
      edges={isChange ? undefined : ['top', 'bottom']}>
      <View style={styles.header}>
        <AppText style={styles.title}>{t('selectCountryTitle')}</AppText>
        <AppText style={styles.subtitle}>{t('selectCountrySubtitle')}</AppText>
      </View>

      <FlatList
        data={countries}
        keyExtractor={item => item.iso}
        contentContainerStyle={styles.list}
        renderItem={({item}) => {
          const active = selected === item.iso;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(item.iso)}
              style={[styles.row, active && styles.rowActive]}>
              <AppText style={styles.flag}>{item.flag}</AppText>
              <View style={styles.rowText}>
                <AppText style={styles.rowTitle}>{t(item.nameKey)}</AppText>
                <AppText style={styles.rowDial}>{item.dialCode}</AppText>
              </View>
              {active ? (
                <Check size={18} color={accent} strokeWidth={2.4} />
              ) : null}
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <AppButton title={t('onboardingNext')} onPress={onContinue} />
      </View>
    </ScreenContainer>
  );
};

export default SelectCountryScreen;
