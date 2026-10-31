import { useEffect } from 'react';

export default function Notice({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(onClose, 15000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;
  return (
    <div className={`notice notice--${notice.type || 'info'}`} role="status">
      <span>{notice.message}</span>
      <button className="notice__close" onClick={onClose} aria-label="Dismiss message" />
    </div>
  );
}
