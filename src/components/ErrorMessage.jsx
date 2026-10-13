export default function ErrorMessage({ title = 'Something went wrong', message }) {
  if (!message) return null;
  return (
    <div className="banner error" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
