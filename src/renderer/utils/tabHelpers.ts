// utils/tabHelpers.ts
import { TabProperties } from '@sinm/react-chrome-tabs';

let id = 1;

export function addTab(tabs: TabProperties[], setTabs: React.Dispatch<React.SetStateAction<TabProperties[]>>) {
  id++;
  setTabs([
    ...tabs.map(tab => ({ ...tab, active: false })),
    { id: `tab-${id}`, url: 'https://dev-api.trymax.ai/v1/api/get-my-ip', label: `New Tab ${id}`, active: true },
  ]);
}

export function closeTab(tabId: string, tabs: TabProperties[], setTabs: React.Dispatch<React.SetStateAction<TabProperties[]>>) {
  const newTabs = tabs.filter(tab => tab.id !== tabId);
  if (newTabs.length > 0) {
    newTabs[0].active = true;
  }
  setTabs(newTabs);
}

export function closeAllTabs(setTabs: React.Dispatch<React.SetStateAction<TabProperties[]>>) {
  setTabs([]);
}

export function reorderTabs(tabId: string, fromIndex: number, toIndex: number, tabs: TabProperties[], setTabs: React.Dispatch<React.SetStateAction<TabProperties[]>>) {
  const tabToMove = tabs.find(tab => tab.id === tabId);
  if (!tabToMove) return;
  const reorderedTabs = tabs.filter(tab => tab.id !== tabId);
  reorderedTabs.splice(toIndex, 0, tabToMove);
  setTabs(reorderedTabs);
}

export function activateTab(tabId: string, tabs: TabProperties[], setTabs: React.Dispatch<React.SetStateAction<TabProperties[]>>) {
  setTabs(tabs.map(tab => ({ ...tab, active: tab.id === tabId })));
}
