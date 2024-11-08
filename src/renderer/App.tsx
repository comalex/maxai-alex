import './App.css';
import TabsContainer from './components/TabsContainer';
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
import { useEffect, useState } from 'react';

export default function App() {
  const [config, setConfig] = useState('');
  const [showPortal, setShowPortal] = useState(false);

  useEffect(() => {
    const fetchPreloadPath = async () => {
      if (window.electron && window.electron.ipcRenderer && window.electron.getConfig) {
        const config = await window.electron.getConfig();
        console.log('config', config);
        setConfig(config);
      }
    };
    fetchPreloadPath();
  }, []);

  if (!config.path) {
    return null;
  }

  const togglePortal = () => {
    setShowPortal(!showPortal);
  };

  return (
    <div>
      <button onClick={togglePortal}>
        {showPortal ? 'Close Portal' : 'Open Portal'}
      </button>
      {showPortal ? (
        <webview
          src="https://dev-portal.pdfviewer.click/"
          style={{ width: '100vw', height: '100vh', border: 'none' }}
        />
      ) : (
        <div className="tabs" style={{ flex: '0 0 70%' }}>
          <TabsContainer config={config} />
        </div>
      )}
    </div>
  );
}
