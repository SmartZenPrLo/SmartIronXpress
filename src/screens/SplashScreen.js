import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing, 
  Dimensions,
  Image,
  StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from '../../assets/AppIconi.png';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [userId, setUserId] = useState(null);

  console.log("User ID in the home screen-----------------------", userId);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      console.log('Stored User ID:', storedUserId);
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      })
    ]).start();

    // Navigation timer
    const timer = setTimeout(() => {
      if (userId) {
        navigation.replace('BottomTabNavigator');
      } else {
        navigation.replace('OnBoardingScreen');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId, navigation]);

  // Bubble Component
  const Bubble = ({ delay, size, left, bottom, color, opacity }) => {
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const animateBubble = () => {
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(bubbleAnim, {
            toValue: 1,
            duration: 4500 + Math.random() * 3000,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start(() => {
          bubbleAnim.setValue(0);
          animateBubble();
        });
      };
      
      animateBubble();
      
      return () => bubbleAnim.stopAnimation();
    }, []);

    const bubbleStyle = {
      opacity: bubbleAnim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0, opacity, opacity, 0],
      }),
      transform: [
        { 
          translateY: bubbleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -height * 0.8],
          }) 
        },
        { 
          translateX: bubbleAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, Math.random() * 40 - 20, 0],
          }) 
        },
        { 
          scale: bubbleAnim.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0.5, 1, 1, 0.5],
          }) 
        },
      ],
      position: 'absolute',
      left: left,
      bottom: bottom,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    };

    return <Animated.View style={bubbleStyle} />;
  };

  // Render bubbles
  const renderBubbles = () => {
    const bubbles = [];
    const bubbleCount = 10;
    
    const colors = ['#F5761A', '#46345B', '#73788B', '#ADB2D4', '#F8F9FF'];
    
    for (let i = 0; i < bubbleCount; i++) {
      const size = 8 + (i % 4) * 6;
      const left = Math.random() * width;
      const bottom = -20 - (Math.random() * 50);
      const color = colors[i % colors.length];
      const opacity = 0.3 + (i * 0.07);
      const delay = i * 300;

      bubbles.push(
        <Bubble
          key={i}
          delay={delay}
          size={size}
          left={left}
          bottom={bottom}
          color={color}
          opacity={opacity}
        />
      );
    }
    
    return bubbles;
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor="#FFFFFF" 
        barStyle="dark-content" 
        translucent={true}
      />
      
      {/* Background Bubbles */}
      <View style={styles.bubblesContainer}>
        {renderBubbles()}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideUpAnim }
              ],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Image
              source={AppIcon}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Animated.Text style={styles.title}>
            Smart Iron Xpress
          </Animated.Text>
          
          <Animated.Text style={styles.tagline}>
            Fresh & Clean, Right at Your Fingertips
          </Animated.Text>
        </Animated.View>

        {/* Loading Dots */}
        <Animated.View 
          style={[
            styles.loadingContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: '#F5761A',
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.footerText}>Making Ironing Simple</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubblesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F5761A',
    shadowColor: '#F5761A',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden', 
  },
  appIcon: {
    width: 130,
    height: 130,
    borderRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#46345B',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  loadingContainer: {
    marginTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    zIndex: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#ADB2D4',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;

// 46345B
// 73788B
// 000000
// ADB2D4