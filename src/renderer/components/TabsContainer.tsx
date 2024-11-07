// components/TabsContainer.tsx
import React, { useEffect, useState } from 'react';
import { Tabs } from '@sinm/react-chrome-tabs';
import Webview from '../Webview';
import SidePanel from '../extension/sidepanel/index';
import {
  closeTab,
  reorderTabs,
  activateTab,
} from '../utils/tabHelpers';
import axios from 'axios';
import { API_URL, X_API_KEY } from '../config';
import { STORAGE_KEYS } from '../extension/config/constants';

import { v4 as uuidv4 } from 'uuid';

// Create a new Modal component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{ display: 'block', position: 'fixed', zIndex: 1, left: 0, top: 0, width: '100%', height: '100%', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div style={{ backgroundColor: '#fefefe', margin: '15% auto', padding: '20px', border: '1px solid #888', width: '30%' }}>
        <span style={{ color: '#aaa', float: 'right', fontSize: '28px', fontWeight: 'bold' }} onClick={onClose}>
          &times;
        </span>
        {children}
      </div>
    </div>
  );
};

interface TabsContainerProps {}

const TabsContainer: React.FC<TabsContainerProps> = () => {
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem('tabs');
    return savedTabs ? JSON.parse(savedTabs) : [];
  });

  useEffect(() => {
    const saveTabsToLocalStorage = () => {
      localStorage.setItem('tabs', JSON.stringify(tabs));
    };

    window.addEventListener('beforeunload', saveTabsToLocalStorage);

    return () => {
      window.removeEventListener('beforeunload', saveTabsToLocalStorage);
    };
  }, [tabs]);

  const [agencyUUID, setAgencyUUID] = useState(() => {
    const storedAgencyUUID = localStorage.getItem(STORAGE_KEYS.AGENCY_UUID);
    return storedAgencyUUID === 'undefined' ? null : storedAgencyUUID;
  });
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
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
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/v2/agency/${agencyUUID}/creators`,
          {
            headers: {
              'X-API-KEY': X_API_KEY,
            },
          }
        );
        setAccounts(response.data);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    if (agencyUUID) {
      fetchAccounts();
    }
  }, [agencyUUID]);


  const handleSelectAccount = (account: any) => {
    const uniqueTabId = `${account.creator_uuid}-${uuidv4()}`;

    // // Optional: Check if the account is already open to avoid duplicates
    // const isAlreadyOpen = tabs.some((tab) => tab.id.startsWith(account.creator_uuid));
    // if (isAlreadyOpen) {
    //   alert(`${account.creator_id} is already open.`);
    //   return;
    // }

    const newTab = {
      id: uniqueTabId,
      uuid: account.creator_uuid,
      url: 'https://onlyfans.com/my/chats',
      label: account.creator_id,
      active: tabs.length === 0,
    };

    setTabs([...tabs, newTab]);
    setShowModal(false);
  };

  if (!agencyUUID) {
    return <SidePanel tab={{ id: 'not_LOGINED' }} />;
  }

  return (
    <>
      <Tabs
        darkMode={false}
        tabs={tabs.map((tab) => ({
          id: tab.id,
          title: tab.label,
          active: tab.active,
        }))}
        onTabClose={(tabId) => closeTab(tabId, tabs, setTabs)}
        onTabReorder={(tabId, fromIndex, toIndex) =>
          reorderTabs(tabId, fromIndex, toIndex, tabs, setTabs)
        }
        onTabActive={(tabId) => activateTab(tabId, tabs, setTabs)}
        pinnedRight={
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Select Account
          </button>
        }
      />

      <div style={{ width: '100%', minHeight: '100px', maxWidth: '100%' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              display: tab.active ? 'block' : 'none',
              width: '100%',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <div style={{ flex: '0 0 65%' }}>
                <Webview src={tab.url} id={tab.uuid} />
              </div>
              <div
                style={{
                  flex: '0 0 33%',
                  maxWidth: '500px',
                  height: '100vh',
                }}
              >
                <SidePanel tab={tab} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>Select Account</h2>
        <ul>
          {accounts.map((account) => (
            <li key={account.uuid} onClick={() => handleSelectAccount(account)}>
              {account.creator_id}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
};

export default TabsContainer;
