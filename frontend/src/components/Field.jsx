export default function Field({ label, name, value, onChange, required = false, type = 'text', placeholder = '', maxLength, multiline = false, rows = 4, hint }) {
  const props = { id: name, name, value, onChange, required, placeholder, maxLength, 'aria-label': label };
  return (
    <label className="field" htmlFor={name}>
      <span className="field__label">
        {label}
        {required ? ' *' : ''}
      </span>
      {multiline ? (
        <textarea {...props} rows={rows} />
      ) : (
        <input {...props} type={type} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}
