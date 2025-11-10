export default function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`bg-black text-white px-3 py-1 rounded ${props.className || ''}`}>{children}</button>
  );
}