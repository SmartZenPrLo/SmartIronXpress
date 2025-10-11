import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';
import NearbyLaundryScreen from '../screens/NearbyLaundryScreen';
import OrdersHistoryScreen from '../screens/OrdersHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useFocusEffect } from '@react-navigation/native';
const Tab = createBottomTabNavigator();
const AnimatedTabBarIcon = ({ focused, name, activeName, size, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [focused, scaleAnim, opacityAnim]);
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <Ionicons
        name={focused ? activeName : name}
        size={size + 2}
        color={color}
      />
    </Animated.View>
  );
};
const BottomTabNavigator = () => {
  const tabBarColor = '#FFFFFF';
  const activeIconColor = '#F5761A';
  const inactiveIconColor = '#73788B';
  const activeLabelColor = '#F5761A';
  const inactiveLabelColor = '#73788B';
  const tabBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(tabBarAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const TabBar = ({ state, descriptors, navigation }) => {
    return (
      <Animated.View 
        style={[
          styles.tabBar, 
          { 
            backgroundColor: tabBarColor,
            borderTopColor: '#ADB2D4',
            transform: [{ translateY: tabBarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}],
            opacity: tabBarAnim
          }
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          let iconName, activeIconName;
          if (route.name === 'NearbyLaundry') {
            iconName = 'home-outline';
            activeIconName = 'home';
          } else if (route.name === 'OrdersHistory') {
            iconName = 'time-outline';
            activeIconName = 'time';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
            activeIconName = 'person';
          }

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabButton}
            >
              <AnimatedTabBarIcon
                focused={focused}
                name={iconName}
                activeName={activeIconName}
                size={24}
                color={focused ? activeIconColor : inactiveIconColor}
              />
              <Animated.Text
                style={[
                  styles.tabLabel,
                  { 
                    color: focused ? activeLabelColor : inactiveLabelColor,
                    opacity: focused ? 1 : 0.8,
                    transform: [{ scale: focused ? 1.05 : 1 }]
                  }
                ]}
              >
                {label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };

  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="NearbyLaundry"
        component={NearbyLaundryScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="OrdersHistory"
        component={OrdersHistoryScreen}
        options={{
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    boxShadow: '5px 5px 10px #ccc',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default BottomTabNavigator;








// import React from 'react';
// import { View, TouchableOpacity, StyleSheet } from 'react-native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import HomeScreen from '../screens/HomeScreen';
// import CategoriesScreen from '../screens/CategoriesScreen';
// import NearbyLaundryScreen from '../screens/NearbyLaundryScreen';
// import OrdersHistoryScreen from '../screens/OrdersHistoryScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// const Tab = createBottomTabNavigator();
// const TabBarCenterButton = ({ children, onPress }) => (
//   <TouchableOpacity
//     style={styles.centerButtonContainer}
//     onPress={onPress}
//     activeOpacity={0.8}
//   >
//     <View style={styles.centerButtonInner}>
//       {children}
//     </View>
//   </TouchableOpacity>
// );
// const BottomTabNavigator = () => {
//   const tabBarColor = '#FFFFFF';
//   const activeIconColor = '#46345B';
//   const inactiveIconColor = '#73788B';
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarShowLabel: false,
//         tabBarStyle: {
//           ...styles.tabBar,
//           backgroundColor: tabBarColor,
//           borderTopColor: '#ADB2D4',
//         },
//         tabBarActiveTintColor: activeIconColor,
//         tabBarInactiveTintColor: inactiveIconColor,
//       }}
//     >
//       {/* <Tab.Screen 
//         name="Home" 
//         component={HomeScreen} 
//         options={{
//           tabBarIcon: ({ color, size, focused }) => (
//             <Ionicons 
//               name={focused ? "home" : "home-outline"} 
//               size={size} 
//               color={color}
//             />
//           ),
//         }}
//       /> */}
//       {/* <Tab.Screen 
//         name="Categories" 
//         component={CategoriesScreen} 
//         options={{
//           tabBarIcon: ({ color, size, focused }) => (
//             <Ionicons 
//               name={focused ? "grid" : "grid-outline"} 
//               size={size + 2} 
//               color={color}
//             />
//           ),
//         }}
//       /> */}
//       <Tab.Screen 
//         name="NearbyLaundry" 
//         component={NearbyLaundryScreen} 
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons 
//               name="search" 
//               size={size + 8} 
//               color={activeIconColor}
//               style={styles.centerIcon}
//             />
//           ),
//           // tabBarButton: (props) => <TabBarCenterButton {...props} />,
//         }}
//       />
//       <Tab.Screen 
//         name="OrdersHistory" 
//         component={OrdersHistoryScreen} 
//         options={{
//           tabBarIcon: ({ color, size, focused }) => (
//             <Ionicons 
//               name={focused ? "time" : "time-outline"} 
//               size={size + 2} 
//               color={color}
//             />
//           ),
//         }}
//       />
//       <Tab.Screen 
//         name="Profile" 
//         component={ProfileScreen} 
//         options={{
//           tabBarIcon: ({ color, size, focused }) => (
//             <Ionicons 
//               name={focused ? "person" : "person-outline"} 
//               size={size} 
//               color={color}
//             />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };
// const styles = StyleSheet.create({
//   tabBar: {
//     height: 56,
//     boxShadow: '5px 5px 10px #cccccc',
//     borderTopWidth: 1,
//   },
//   centerButtonContainer: {
//     top: -16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   centerButtonInner: {
//     width: 58,
//     height: 58,
//     borderRadius: 29,
//     backgroundColor: '#FFFFFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     boxShadow: '5px 5px 10px #000000',
//     borderWidth: 2,
//     borderColor: '#DBDBDB',
//   },
//   centerIcon: {
//     textAlign: 'center',
//   },
// });

// export default BottomTabNavigator;