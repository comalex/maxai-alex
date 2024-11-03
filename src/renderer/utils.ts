import { TbChevronCompactLeft } from "react-icons/tb";

export const getWebviewHTML = async (webviewId: string): Promise<string | null> => {
  console.log("webviewId", webviewId)
  const webview = document.getElementById(webviewId) as any;
  if (webview && typeof webview.executeJavaScript === 'function') {
    try {
      const html = await webview.executeJavaScript('document.documentElement.outerHTML');
      return html;
    } catch (error) {
      console.error('Error executing JavaScript in webview:', error);
      return null;
    }
  } else {
    console.error('Webview not found or executeJavaScript method is not available');
    return null;
  }
};

export const getWebviewCurrentURL = async (webviewId: string): Promise<string | null> => {
  console.log("webviewId", webviewId)
  const webview = document.getElementById(webviewId) as any;
  if (webview && typeof webview.executeJavaScript === 'function') {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 3 seconds
      const url = await webview.executeJavaScript('window.location.href');
      console.log('Current URL:', url);
      return url;
    } catch (error) {
      console.error('Error executing JavaScript in webview:', error);
      return null;
    }
  } else {
    console.error('Webview not found or executeJavaScript method is not available');
    return null;
  }
};
