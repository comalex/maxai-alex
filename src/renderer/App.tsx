import React, { useState, useEffect } from 'react';
import './App.css';
import TabsContainer from './components/TabsContainer';
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
import { TabProperties } from '@sinm/react-chrome-tabs';
import axios from 'axios';
import { API_URL, X_API_KEY, AGENCY_UUID } from './config';

export default function App() {
  const [tabs, setTabs] = useState<TabProperties[]>([]);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/v2/agency/${AGENCY_UUID}/creators`,
          {
            headers: {
              'X-API-KEY': X_API_KEY,
            },
          }
        );
        const fetchedTabs = response.data.map((account: { uuid: string; label: string }, index: number) => ({
          id: account.creator_uuid,
          url: 'https://onlyfans.com/my/chats/chat/196992987/', // Assuming a default URL for each tab
          label: account.creator_id,
          active: index === 0, // Make the first tab active
        }));
        setTabs(fetchedTabs.slice(0, 1));
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    fetchTabs();
  }, []);

  return (
    <div>
      <div className="tabs" style={{ flex: '0 0 70%' }}>
        <TabsContainer tabs={tabs} setTabs={setTabs} />
      </div>
    </div>
  );
}
