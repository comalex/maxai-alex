export interface AuthData {
  app_settings: {
    sess: string;
    _cfuvid: string;
    auth_id: string;
    bcTokenSha: string;
  };
  proxy: {
    type: string;
    ip: string;
    port: string;
    username: string;
    password: string;
  };
}
