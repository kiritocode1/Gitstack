import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing token status on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        if (typeof browser !== 'undefined' && browser.storage?.sync) {
          const result = await browser.storage.sync.get('githubToken') as { githubToken?: string };
          if (result.githubToken) {
            setHasToken(true);
          }
        }
      } catch (e) {
        console.warn('Could not load token status:', e);
      }
    };
    loadToken();
  }, []);

  const saveToken = async () => {
    if (!token.trim()) return;
    setSaving(true);
    try {
      if (typeof browser !== 'undefined' && browser.storage?.sync) {
        await browser.storage.sync.set({ githubToken: token.trim() });
        setHasToken(true);
        setToken('');
        setShowSettings(false);
      }
    } catch (e) {
      console.error('Failed to save token:', e);
    }
    setSaving(false);
  };

  const removeToken = async () => {
    setSaving(true);
    try {
      if (typeof browser !== 'undefined' && browser.storage?.sync) {
        await browser.storage.sync.remove('githubToken');
        setHasToken(false);
        setToken('');
      }
    } catch (e) {
      console.error('Failed to remove token:', e);
    }
    setSaving(false);
  };

  return (
    <>
      <div className="content-area">
        <div className="section-label">[EXTENSION] 拡張</div>

        <div className="title-row">
          <img src="/logo.svg" className="logo-main" alt="Logo" />
          <h1 className="display-title">GitStack Detector</h1>
        </div>

        <p className="description">
          Automatically detects and displays the technology stack of the current GitHub repository.
          <br /><br />
          <span className="status-indicator">●</span> System active
        </p>

        {/* Settings Section */}
        <div className="settings-section">
          <div className="settings-header" onClick={() => setShowSettings(!showSettings)}>
            <span className="settings-label">[SETTINGS] 設定</span>
            <span className={`settings-chevron ${showSettings ? 'open' : ''}`}>▼</span>
          </div>

          {showSettings && (
            <div className="settings-content">
              <div className="setting-item">
                <div className="setting-title">
                  GitHub Token
                  {hasToken && <span className="token-status active">● Active</span>}
                  {!hasToken && <span className="token-status inactive">○ Not set</span>}
                </div>
                <div className="setting-desc">
                  Increases rate limit from 60 to 5,000 requests/hour
                </div>

                {hasToken ? (
                  <button
                    className="token-btn remove"
                    onClick={removeToken}
                    disabled={saving}
                  >
                    {saving ? 'Removing...' : 'Remove Token'}
                  </button>
                ) : (
                  <div className="token-input-row">
                    <input
                      type="password"
                      className="token-input"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveToken()}
                    />
                    <button
                      className="token-btn save"
                      onClick={saveToken}
                      disabled={saving || !token.trim()}
                    >
                      {saving ? '...' : 'Save'}
                    </button>
                  </div>
                )}

                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  className="token-help"
                >
                  Create a token →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <div className="footer-top">
          <div className="branding-section">
            <div className="brand-row">
              <span className="brand-name">BLANK</span>
              <span className="jp-text">空白</span>
            </div>
            <div className="brand-role">DIGITAL ARTISAN</div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-col">
            <div className="footer-label">[CONTACT] 連絡</div>
            <a href="https://aryank.space" target="_blank" className="footer-link">
              aryank.space <span className="arrow">↗</span>
            </a>
            <a href="https://x.com/blank_spacets" target="_blank" className="footer-link">
              @blank_spacets <span className="arrow">↗</span>
            </a>
          </div>
          <div className="footer-col align-right">
            <div className="footer-label">[HELP] ヘルプ</div>
            <a href="https://x.com/blank_spacets" target="_blank" className="footer-link footer-link-muted">
              DM for suggestions
            </a>
            <div className="footer-label" style={{ marginTop: '8px' }}>[VERSION]</div>
            <div className="footer-sub">v1.0.2</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
