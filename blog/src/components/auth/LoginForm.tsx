import { outlineButtonSmall } from '@/lib/styles/ui';

export default function LoginForm() {
  return (
    <form className="space-y-3">
      <input className="border rounded w-full p-2" type="email" placeholder="이메일" />
      <button className={`${outlineButtonSmall} w-full`}>매직 링크 보내기</button>
    </form>
  );
}
