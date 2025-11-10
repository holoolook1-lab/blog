export type Toast = {
  type: 'success' | 'error';
  message: string;
};

export const ActionToast = ({ type, message }: Toast) => (
  <div
    role={type === 'error' ? 'alert' : 'status'}
    aria-live={type === 'error' ? 'assertive' : 'polite'}
    aria-atomic="true"
    className={`fixed top-4 right-4 z-50 rounded-md px-4 py-2 text-sm font-medium shadow-lg \
    ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {message}
  </div>
);