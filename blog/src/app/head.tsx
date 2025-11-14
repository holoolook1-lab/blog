export default function Head() {
  const supaOrigin = (() => {
    try {
      const u = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
      return u ? `${u.protocol}//${u.hostname}` : undefined;
    } catch {
      return undefined;
    }
  })();
  return (
    <>
      {supaOrigin && (
        <>
          <link rel="preconnect" href={supaOrigin} />
          <link rel="dns-prefetch" href={supaOrigin} />
        </>
      )}
      <link rel="preconnect" href="https://i.ytimg.com" />
      <link rel="dns-prefetch" href="https://i.ytimg.com" />
    </>
  );
}
