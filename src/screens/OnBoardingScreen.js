import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Icon from '@react-native-vector-icons/ionicons';
const { width, height } = Dimensions.get('window');
const slides = [
  {
    id: '1',
    title: 'Easy Laundry Service',
    description: 'Schedule pickups and deliveries with just a few taps',
    icon: 'shirt-outline',
  },
  {
    id: '2',
    title: 'Track Your Orders',
    description: 'Know exactly where your laundry is at all times',
    icon: 'location-outline',
  },
  {
    id: '3',
    title: 'Multiple Service Options',
    description: 'Choose from wash & fold, dry cleaning, and more',
    icon: 'options-outline',
  },
  {
    id: '4',
    title: 'Fast Delivery',
    description: 'Get your clean clothes back within 24 hours',
    icon: 'time-outline',
  },
];

const OnBoardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

const viewableItemsChanged = useRef(({ viewableItems }) => {
  if (viewableItems && viewableItems.length > 0) {
    setCurrentIndex(viewableItems[0].index);
  }
}).current;


  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      console.log('Get Started!');
      navigation.replace('Terms');
    }
  };
  
  const handleSkip = () => {
    slidesRef.current.scrollToIndex({ index: slides.length - 1, animated: true });
  };

  const Indicator = ({ scrollX }) => {
    return (
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`indicator-${i}`}
              style={[
                styles.indicator,
                { width: dotWidth, opacity, backgroundColor: i === currentIndex ? '#46345B' : '#ADB2D4' },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <FlatList
          data={slides}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Animated.View 
                style={[styles.iconContainer, {
                  transform: [{ 
                    translateY: scrollX.interpolate({
                      inputRange: [
                        (parseInt(item.id) - 2) * width,
                        (parseInt(item.id) - 1) * width,
                        parseInt(item.id) * width
                      ],
                      outputRange: [100, 0, 100],
                      extrapolate: 'clamp'
                    })
                  }]
                }]}
              >
                <Icon name={item.icon} size={100} color="#F5761A" />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: scrollX.interpolate({
                    inputRange: [
                      (parseInt(item.id) - 2) * width,
                      (parseInt(item.id) - 1) * width,
                      parseInt(item.id) * width
                    ],
                    outputRange: [0, 1, 0],
                    extrapolate: 'clamp'
                  })
                }}
              >
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </Animated.View>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>
      <Indicator scrollX={scrollX} />
      <View style={styles.buttonContainer}>
        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#F5761A' }]}
            onPress={scrollTo}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#F5761A' }]}
            onPress={scrollTo}
          >
            <Text style={[styles.buttonText, { color: '#000000' }]}>Next</Text>
            <Icon name="arrow-forward" size={20} color="#000000" style={styles.buttonIcon} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  skipContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5761A',
  },
  contentContainer: {
    flex: 3,
  },
  slide: {
    flex: 1,
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(245, 117, 26, 0.12)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000000',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#73788B',
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  indicator: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.6,
    padding: 15,
    borderRadius: 30,
    boxShadow: '5px 5px 10px #cccccc',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
});

export default OnBoardingScreen;