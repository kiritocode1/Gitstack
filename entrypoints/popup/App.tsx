import './App.css';

function App() {
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
          </div>
          <div className="footer-col align-right">
            <div className="footer-label">[VERSION]</div>
            <div className="footer-sub">v1.0.0</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
