import 'react-native-gesture-handler';
import {registerRootComponent} from 'expo';
import {setupGlobalErrorHandler} from '@app/utils/errorHandler';
import App from './src/App';

setupGlobalErrorHandler();

registerRootComponent(App);
