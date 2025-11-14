import React, { useState } from 'react';

// 간단한 UI 컴포넌트들
export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  variant = "default", 
  size = "default", 
  className = "",
  onClick,
  ...props 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "outline"; 
  size?: "default" | "sm"; 
  className?: string;
  onClick?: () => void;
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = variant === "outline" 
    ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500" 
    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
  const sizeClasses = size === "sm" 
    ? "px-3 py-2 text-sm" 
    : "px-4 py-3";
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const Tabs = ({ children, defaultValue, className = "" }: { 
  children: React.ReactNode; 
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            activeTab, 
            setActiveTab,
            key: index 
          });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab }: { 
  children: React.ReactNode; 
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}) => (
  <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
    {React.Children.map(children, (child, index) => 
      React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab, key: index })
    )}
  </div>
);

export const TabsTrigger = ({ 
  children, 
  value, 
  activeTab, 
  setActiveTab 
}: { 
  children: React.ReactNode; 
  value: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}) => (
  <button
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      activeTab === value 
        ? 'bg-white text-blue-600 shadow-md' 
        : 'text-gray-600 hover:text-gray-900'
    }`}
    onClick={() => setActiveTab?.(value)}
  >
    {children}
  </button>
);

export const TabsContent = ({ 
  children, 
  value, 
  activeTab 
}: { 
  children: React.ReactNode; 
  value: string;
  activeTab?: string;
}) => (
  <div className={activeTab === value ? 'block' : 'hidden'}>
    {children}
  </div>
);