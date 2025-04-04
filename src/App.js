import React from 'react';
import { useRoutes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { routes } from './routes';
import './styles/global.scss';

function App() {
  const routeElements = useRoutes(routes);
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationProvider>
          {routeElements}
        </NavigationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
