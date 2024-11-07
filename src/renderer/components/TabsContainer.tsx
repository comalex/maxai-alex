// components/TabsContainer.tsx
import React, { useEffect, useState } from 'react';
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
import axios from 'axios';
import { API_URL, X_API_KEY } from '../config';
import { STORAGE_KEYS } from '../extension/config/constants';

interface TabsContainerProps {}

const TabsContainer: React.FC<TabsContainerProps> = () => {
  const [tabs, setTabs] = useState<TabProperties[]>([]);
  const [agencyUUID, setAgencyUUID] = useState(() => {
    const storedAgencyUUID = localStorage.getItem(STORAGE_KEYS.AGENCY_UUID);
    return storedAgencyUUID === 'undefined' ? null : storedAgencyUUID;
  });

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEYS.AGENCY_UUID) {
        setAgencyUUID(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/v2/agency/${agencyUUID}/creators`,
          {
            headers: {
              'X-API-KEY': X_API_KEY,
            },
          }
        );
        const fetchedTabs = response.data.map((account: { uuid: string; label: string }, index: number) => ({
          id: account.creator_uuid,
          url: 'https://onlyfans.com/my/chats', // Assuming a default URL for each tab
          label: account.creator_id,
          active: index === 0, // Make the first tab active
        }));
        setTabs(fetchedTabs.slice(0, 1)); // TODO remove slice
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };
    if (agencyUUID) {
      fetchTabs();
    }
  }, [agencyUUID]);


  if (!agencyUUID) {
    return <SidePanel tab={{id: "not_LOGINED"}} />
  }

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
              <div style={{ flex: '0 0 65%' }}>
                <Webview src={tab.url} id={tab.id} />
              </div>
              <div style={{ flex: '0 0 33%', maxWidth: '500px', height: '100vh' }}>
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
