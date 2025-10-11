import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';
const NearbyLaundrySkeleton = () => {
  return (
    <View style={styles.container}> 
      <View style={styles.contentContainer}>
        {[...Array(6)].map((_, index) => (
          <View key={index} style={styles.laundryItem}>
            <ContentLoader 
              speed={2}
              width="100%"
              height={80}
              backgroundColor="#f3f3f3"
              foregroundColor="#ecebeb"
            >
              <Rect x="0" y="0" rx="8" ry="8" width="80" height="80" />
              <Rect x="95" y="10" rx="4" ry="4" width="150" height="16" />
              <Rect x="95" y="35" rx="3" ry="3" width="250" height="12" />
              <Rect x="95" y="55" rx="3" ry="3" width="120" height="12" />
            </ContentLoader>
          </View>
        ))}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  header: { 
    backgroundColor: '#46345B', 
    padding: 16, 
    alignItems: 'center',
    boxShadow: '5px 5px 10px #ccc',
    position: 'relative',
  },
  headerText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ADB2D4',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#46345B',
  },
  tabText: {
    color: '#73788B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  laundryItem: { 
    padding: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#ADB2D4',
  },
  refreshButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  }
});
export default NearbyLaundrySkeleton;