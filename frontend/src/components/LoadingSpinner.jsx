import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = '', fullScreen = false, inline = false }) => {
  const sizeClass = size === 'small' ? 'spinner-small' : size === 'large' ? 'spinner-large' : 'spinner-medium';
  
  if (inline) {
    return (
      <span className="loading-spinner-inline">
        <span className="spinner-ring"></span>
      </span>
    );
  }
  
  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        <div className={`loading-spinner ${sizeClass}`}>
          <div className="spinner-ring"></div>
        </div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    );
  }
  
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${sizeClass}`}>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
