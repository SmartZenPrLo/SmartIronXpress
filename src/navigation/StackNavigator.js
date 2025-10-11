import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import TermsScreen from '../screens/TermsScreen';
import BottomTabNavigator from './BottomTabNavigator';
import OnBoardingScreen from '../screens/OnBoardingScreen';
import PhoneNumber from '../screens/PhoneNumber';
import LoginScreen from '../screens/LoginScreen';
import OtpVerification from '../screens/OtpVerification';
import MapScreen from '../screens/MapScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PlaceOrderScreen from '../screens/PlaceOrderScreen';
import TrackOrder from '../screens/TrackOrder';
import ForgetPasswordScreen from '../screens/ForgetPasswordScreen';
const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OnBoardingScreen" component={OnBoardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false}} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false}} />
      <Stack.Screen name="PhoneNumber" component={PhoneNumber} options={{ headerShown: false}} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} options={{ headerShown: false}} />
      <Stack.Screen name="MapScreen" component={MapScreen} options={{ headerShown: false}} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ headerShown: false}} />
      <Stack.Screen name="BottomTabNavigator" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PlaceOrderScreen" component={PlaceOrderScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TrackOrder" component={TrackOrder} options={{ headerShown: false }} />
      <Stack.Screen name="ForgetPasswordScreen" component={ForgetPasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
