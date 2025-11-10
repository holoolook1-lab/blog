export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border rounded p-2 ${props.className || ''}`} />;
}