export default function Notice({ notice, onClose }) {
  if (!notice) return null;
  return <div className={`notice notice--${notice.type || 'info'}`} role="status"><span>{notice.message}</span><button className="notice__close" onClick={onClose} aria-label="Dismiss message"></button></div>;
}
