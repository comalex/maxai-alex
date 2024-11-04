// components/TabsContainer.tsx
import React from 'react';
import { Tabs, TabProperties } from '@sinm/react-chrome-tabs';
import Webview from '../Webview';
import SidePanel from '../extension/sidepanel/index';
import {
  addTab,
  closeTab,
  closeAllTabs,
  reorderTabs,
  activateTab,
} from '../utils/tabHelpers';

interface TabsContainerProps {
  tabs: TabProperties[];
  setTabs: React.Dispatch<React.SetStateAction<TabProperties[]>>;
}

const TabsContainer: React.FC<TabsContainerProps> = ({ tabs, setTabs }) => {
  return (
    <>
      <Tabs
        darkMode={false}
        tabs={tabs.map(tab => ({
          id: tab.id,
          title: tab.label,
          active: tab.active,
        }))}
        onTabClose={tabId => closeTab(tabId, tabs, setTabs)}
        onTabReorder={(tabId, fromIndex, toIndex) => reorderTabs(tabId, fromIndex, toIndex, tabs, setTabs)}
        onTabActive={tabId => activateTab(tabId, tabs, setTabs)}
        pinnedRight={<button onClick={() => addTab(tabs, setTabs)}>+</button>}
      />

      <div style={{ width: '100%', minHeight: '100px', maxWidth: '100%' }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            style={{ display: tab.active ? 'block' : 'none', width: '100%', height: '100%' }}
          >
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <div style={{ flex: '0 0 70%' }}>
                <Webview src={tab.url} id={tab.id} />
              </div>
              <div style={{ flex: '0 0 30%', maxWidth: '500px', height: '100vh' }}>
                <SidePanel tab={tab} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TabsContainer;
