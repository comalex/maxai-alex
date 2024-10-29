type Message = any;
interface Sender {
  id: string;
  url: string;
}
interface Response {
  success: boolean;
  data?: any;
  error?: string;
}
type SendResponse = (response: Response) => void & { called?: boolean };

interface Listener {
  (message: Message, sender: Sender, sendResponse: SendResponse): void;
}

class EventBus {
  private static instance: EventBus;

  private listeners: Listener[];

  constructor() {
    this.listeners = [];
  }
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  // Adds a message listener
  addListener(listener: Listener): void {
    console.log("add listeners");
    this.listeners.push(listener);
  }

  // Removes a message listener
  removeListener(listener: Listener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  // Emits a message to all listeners
  emit(message: Message, sender: Sender, sendResponse: SendResponse): void {
    console.log("this.listeners", this.listeners)
    this.listeners.forEach((listener) => {
      // Allow listener to call sendResponse asynchronously
      const sendResponseWrapper: SendResponse = (response: Response) => {
        // if (!sendResponse.called) {
        //   sendResponse.called = true;
        //   sendResponse(response);
        // }
      };
      // sendResponseWrapper.called = false;
      listener(message, sender, sendResponseWrapper);
    });
  }
}

const eventBus = EventBus.getInstance();

export const onMessage = {
  addListener: (listener: Listener) => eventBus.addListener(listener),
  removeListener: (listener: Listener) => eventBus.removeListener(listener),
  emit: (message: Message, sender: Sender, sendResponse: SendResponse) =>
    eventBus.emit(message, sender, sendResponse)
};

export function sendMessage(message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    // Simulate message sender
    const sender: Sender = { id: "sender-id", url: "https://example.com" };

    // sendResponse function to handle asynchronous responses
    const sendResponse: SendResponse = (response: Response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    };

    // Initialize the response as not called yet
    sendResponse.called = false;

    // Emit the message to all listeners
    onMessage.emit(message, sender, sendResponse);
  });
}
