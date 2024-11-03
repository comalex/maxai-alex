import React, { useState } from 'react';
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
import './App.css';
import SidePannel from './extension/sidepanel/index';
import Webview from './Webview';
import { Tabs, TabProperties } from '@sinm/react-chrome-tabs';

let id = 1;

export default function App() {
  const [tabs, setTabs] = useState<TabProperties[]>([
    // { id: 'tab-1', url: 'https://dev-api.trymax.ai/v1/api/get-my-ip', label: 'Chat 1', active: true },
    // { id: 'tab-2', url: 'https://dev-api.trymax.ai/v1/api/get-my-ip', label: 'Chat 2', active: false },
    { id: 'tab-1', url: 'https://onlyfans.com/my/chats/chat/39895946/', label: 'Chat 1' },
    { id: 'tab-2', url: 'https://dev-api.trymax.ai/v1/api/get-my-ip', label: 'Chat 2', active: false },
  ]);

  const addTab = () => {
    id++;
    setTabs([
      ...tabs.map(tab => ({ ...tab, active: false })), // Deactivate all existing tabs
      {
        id: `tab-${id}`,
        url: 'https://dev-api.trymax.ai/v1/api/get-my-ip',
        label: `New Tab ${id}`,
        active: true,
      },
    ]);
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    if (newTabs.length > 0) {
      newTabs[0].active = true;
    }
    setTabs(newTabs);
  };

  const closeAllTabs = () => setTabs([]);

  const reorderTabs = (tabId: string, fromIndex: number, toIndex: number) => {
    const tabToMove = tabs.find(tab => tab.id === tabId);
    if (!tabToMove) return;
    const reorderedTabs = tabs.filter(tab => tab.id !== tabId);
    reorderedTabs.splice(toIndex, 0, tabToMove);
    setTabs(reorderedTabs);
  };

  const activateTab = (tabId: string) => {
    setTabs(tabs.map(tab => ({ ...tab, active: tab.id === tabId })));
  };

  const activeTab = tabs.find(tab => tab.active);

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div className="tabs" style={{ flex: '0 0 70%' }}>
        <Tabs
          darkMode={false} // Change to true for dark mode
          tabs={tabs.map(tab => ({
            id: tab.id,
            title: tab.label,
            active: tab.active,
          }))}
          onTabClose={closeTab}
          onTabReorder={reorderTabs}
          onTabActive={activateTab}
          pinnedRight={<button onClick={addTab}>+</button>}
        />

        {activeTab && (
          <div style={{ width: '100%', minHeight: '100px' }}>
            {/* <button onClick={addTab}>Add Tab</button>
            <button onClick={closeAllTabs}>Close All</button> */}
            <Webview src={activeTab.url} id={activeTab.id} />
          </div>
        )}
      </div>
      <div className="ext" style={{ flex: '0 0 30%' }}>
        <SidePannel />
      </div>
    </div>
  );
}
