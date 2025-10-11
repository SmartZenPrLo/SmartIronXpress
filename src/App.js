import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import AppUpdateChecker from './screens/AppUpdateChecker';

const App = () => {
  return (
    <>
      <AppUpdateChecker />
      <AppNavigator />
    </>
  );
};

export default App;
