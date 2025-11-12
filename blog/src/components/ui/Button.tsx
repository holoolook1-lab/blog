import { outlineButtonSmall } from '@/lib/styles/ui';

export default function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${outlineButtonSmall} ${props.className || ''}`}>{children}</button>
  );
}
