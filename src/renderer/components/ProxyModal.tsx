import React, { FormEvent, useState, useEffect } from 'react';
import { API_URL, X_API_KEY } from '../config';

interface ProxyModalProps {
  onClose: () => void;
  creatorUUID: string;
  elem_id: string;
}

const ProxyModal: React.FC<ProxyModalProps> = ({
  onClose,
  creatorUUID,
  elem_id,
}) => {
  const [showAddProxyForm, setShowAddProxyForm] = useState(false);
  const [proxyList, setProxyList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);
  const [selectedProxy, setSelectedProxy] = useState<any | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [creatorSettings, setCreatorSettings] = useState<any | null>(null);
  async function getProxyList() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v2/proxy/${creatorUUID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': `${X_API_KEY}`,
        },
      });
      const data = await response.json();
      setProxyList(data.data);
    } catch (error) {
      console.error('Error fetching proxy list:', error);
      setProxyList([]);
    } finally {
      setLoading(false);
    }
  }

  async function getCreatorSettings() {
    setLoadingSettings(true);
    try {
      const response = await fetch(
        `${API_URL}/api/v2/creator/${creatorUUID}/settings`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': `${X_API_KEY}`,
          },
        },
      );
      const data = await response.json();
      console.log('creatorSettings 2222', data);
      setCreatorSettings(data);
      setSelectedProxy(data?.proxy);
    } catch (error) {
      console.error('Error fetching creator settings:', error);
      setCreatorSettings({});
    } finally {
      setLoadingSettings(false);
    }
  }

  useEffect(() => {
    getProxyList();
    getCreatorSettings();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const proxyType = formData.get('proxy-type') as string;
    const proxyHost = formData.get('proxy-host') as string;
    const proxyPort = formData.get('proxy-port') as string;
    const proxyUsername = formData.get('proxy-username') as string;
    const proxyPassword = formData.get('proxy-password') as string;

    const payload = {
      of_account_uuid: creatorUUID,
      type: proxyType,
      host: proxyHost,
      port: proxyPort,
      username: proxyUsername,
      password: proxyPassword,
    };

    fetch(`${API_URL}/api/v2/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': `${X_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          console.log('Proxy saved successfully:', data);
          getProxyList();
          setShowAddProxyForm(false);
        } else {
          console.error('Error saving proxy:', data.message);
        }
      })
      .catch((error) => {
        console.error('Error during proxy save:', error);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function updateAccount() {
    if (selectedProxy) {
      const updateData = {
        account_proxy_id: selectedProxy.uuid,
      };

      fetch(`${API_URL}/api/v2/creator/${creatorUUID}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': `${X_API_KEY}`,
        },
        body: JSON.stringify(updateData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === 'success') {
            console.log('Account updated successfully:', data);
          } else {
            console.error('Error updating account:', data.message);
          }
        })
        .catch((error) => {
          console.error('Error during account update:', error);
        })
        .finally(() => {
          setLoadingSettings(false);
          onClose();
        });
    } else {
      console.error('No proxy selected');
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '40%',
        left: '35%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '10px',
        border: '1px solid grey',
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '20px',
        }}
      >
        <h1>Proxy</h1>
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '20px',
        }}
      >
        <button
          type="button"
          style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            marginRight: '10px',
          }}
          onClick={() => setShowAddProxyForm(!showAddProxyForm)}
        >
          {showAddProxyForm ? 'Cancel' : 'Add Proxy'}
        </button>
        <button
          type="button"
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
          }}
          onClick={() => onClose()}
        >
          Close
        </button>
      </div>
      {showAddProxyForm && (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <label
              htmlFor="proxy-type"
              style={{ marginRight: '10px', width: '120px' }}
            >
              Type:
            </label>
            <input
              id="proxy-type"
              name="proxy-type"
              type="text"
              placeholder="Proxy Type"
              style={{
                margin: '5px',
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid grey',
              }}
            />
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <label
              htmlFor="proxy-host"
              style={{ marginRight: '10px', width: '120px' }}
            >
              Host / IP:
            </label>
            <input
              id="proxy-host"
              name="proxy-host"
              type="text"
              placeholder="Proxy Host / IP"
              style={{
                margin: '5px',
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid grey',
              }}
            />
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '10px',
            }}
          >
            <label
              htmlFor="proxy-port"
              style={{ marginRight: '10px', width: '120px' }}
            >
              Port:
            </label>
            <input
              id="proxy-port"
              name="proxy-port"
              type="text"
              placeholder="Proxy Port"
              style={{
                margin: '5px',
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid grey',
              }}
            />
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '10px',
            }}
          >
            <label
              htmlFor="proxy-username"
              style={{ marginRight: '10px', width: '120px' }}
            >
              Username:
            </label>
            <input
              id="proxy-username"
              name="proxy-username"
              type="text"
              placeholder="Proxy Username"
              style={{
                margin: '5px',
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid grey',
              }}
            />
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '10px',
            }}
          >
            <label
              htmlFor="proxy-password"
              style={{ marginRight: '10px', width: '120px' }}
            >
              Password:
            </label>
            <input
              id="proxy-password"
              name="proxy-password"
              type="password"
              placeholder="Proxy Password"
              style={{
                margin: '5px',
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid grey',
              }}
            />
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <button
              type="submit"
              style={{
                backgroundColor: 'blue',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '5px',
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <div style={{ marginTop: '50px', marginLeft: '50px' }}>Loading...</div>
      ) : (
        <div style={{ marginTop: '50px' }}>
          <ul style={{ marginLeft: '50px', listStyle: 'none' }}>
            {proxyList.map((proxy, index) => {
              return (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <span style={{ marginRight: '30px' }}>
                    Type: {proxy?.type?.toUpperCase() || ''}
                  </span>
                  <span>Host: {proxy.host}</span>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('proxy 222', proxy);
                      setSelectedProxy(proxy);
                    }}
                    style={{
                      marginLeft: '10px',
                      backgroundColor:
                        selectedProxy?.uuid === proxy?.uuid
                          ? 'darkblue'
                          : 'lightblue',
                      color:
                        selectedProxy?.uuid === proxy?.uuid ? 'white' : 'black',
                      borderRadius: '5px',
                      padding: '5px',
                    }}
                  >
                    {selectedProxy?.uuid === proxy?.uuid
                      ? 'Selected'
                      : 'Select'}
                  </button>
                </li>
              );
            })}
          </ul>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            <button
              type="button"
              onClick={updateAccount}
              style={{
                marginTop: '20px',
                backgroundColor: 'orange',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '5px',
              }}
            >
              Update Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyModal;
