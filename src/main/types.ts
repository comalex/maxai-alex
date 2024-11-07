export interface Proxy {
  type: string;
  host: string;
  port: string;
  username: string;
  password: string;
}


export interface AuthData {
  app_settings: {
    sess: string;
    _cfuvid: string;
    auth_id: string;
    bcTokenSha: string;
  };
  proxy: Proxy;
}

