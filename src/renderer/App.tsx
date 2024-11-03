// App.tsx
import React, { useState } from 'react';
import './App.css';
import TabsContainer from './components/TabsContainer';
import SidePanel from './extension/sidepanel/index';
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
import { TabProperties } from '@sinm/react-chrome-tabs';

let id = 1;

export default function App() {
  const [tabs, setTabs] = useState<TabProperties[]>([
    // { id: 'tab-1', url: 'https://onlyfans.com/my/chats/chat/39895946/', label: 'Chat 1', active: true, },
    { id: '987e6543-e21b-12d3-a456-426614174001', url: 'https://dev-api.trymax.ai/v1/api/get-my-ip', label: 'Legrand', active: true, },
    { id: '123e4567-e89b-12d3-a456-426614174000', url: 'https://dev-api.trymax.ai/v1/api/get-my-ip', label: 'Tayler', active: false },
  ]);

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div className="tabs" style={{ flex: '0 0 70%' }}>
        <TabsContainer tabs={tabs} setTabs={setTabs} />
      </div>
      <div className="ext" style={{ flex: '0 0 30%' }}>
        {/* <SidePanel /> */}
      </div>
    </div>
  );
}
