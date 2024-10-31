import React, { useState } from 'react';
import './App.css';
import SidePannel from './extension/sidepanel/index';
import { getWebviewHTML } from "./utils";

function Webview({ src, id }) {
  const partitionId = `persist:${id}`; // Directly set unique partition ID

  // Function to get webview HTML
  return (
    <div className="">
      {/* <button onClick={getWebviewHTML}>Get Webview HTML</button> */}
      <webview
        id={id}
        src={src}
        className="webview-content"
        partition={partitionId}
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
        preload="./webview-preload.js"
      />
    </div>
  );
}



function Tab({ label, onClick, isActive }) {
  return (
    <button
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function App() {
  const [tabs] = useState([
    { id: 'tab-1', url: 'https://onlyfans.com/my/chats/chat/39895946/', label: 'Chat 1' },
    // { id: 'tab-2', url: 'https://onlyfans.com/', label: 'Chat 2' },
    // Add more tabs as needed
  ]);

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Find the active tab's data for rendering
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: '0 0 30%', order: 1, overflow: 'auto' }}>
        <SidePannel />
      </div>
      <div className="tab-bar1" style={{ flex: '0 0 70%', minHeight: '1000px' }}>
        {tabs.map((tab) => (
          <div key={tab.id} style={{ minHeight: '1000px' }}>
            {tab.id === activeTab && activeTabData && (
              <div style={{ width: '100%', minHeight: '100px' }}>
                <Webview src={activeTabData.url} id={activeTabData.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
