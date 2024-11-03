// components/TabsContainer.tsx
import React from 'react';
import { Tabs, TabProperties } from '@sinm/react-chrome-tabs';
import Webview from '../Webview';
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
  const activeTab = tabs.find(tab => tab.active);

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

      {activeTab && (
        <div style={{ width: '100%', minHeight: '100px' }}>
          <Webview src={activeTab.url} id={activeTab.id} />
        </div>
      )}
    </>
  );
};

export default TabsContainer;
