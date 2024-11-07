import './App.css';
import TabsContainer from './components/TabsContainer';
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
import { useEffect, useState } from 'react';


export default function App() {
  const [config, setConfig] = useState('');
  useEffect(() => {
    const fetchPreloadPath = async () => {
      if (window.electron && window.electron.ipcRenderer && window.electron.getConfig) {
        const config = await window.electron.getConfig();
        console.log("config", config)
        setConfig(config);
      }
    };
    fetchPreloadPath();
  }, []);
  if (!config.path) {
    return null;
  }
  return (
    <div>
      <div className="tabs" style={{ flex: '0 0 70%' }}>
        <TabsContainer config={config} />
      </div>
    </div>
  );
}
