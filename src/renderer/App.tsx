import './App.css';
import TabsContainer from './components/TabsContainer';
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';


export default function App() {
  return (
    <div>
      <div className="tabs" style={{ flex: '0 0 70%' }}>
        <TabsContainer />
      </div>
    </div>
  );
}
