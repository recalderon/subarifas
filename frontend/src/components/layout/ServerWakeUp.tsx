import React, { useEffect, useState } from 'react';
import { healthAPI } from '../../services/api';

interface ServerWakeUpProps {
  children: React.ReactNode;
}

const ServerWakeUp: React.FC<ServerWakeUpProps> = ({ children }) => {
  const [isAwake, setIsAwake] = useState(false);
  const [isLongWait, setIsLongWait] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        // Set a timeout to show the "long wait" message if it takes more than 1.5 seconds
        const timer = setTimeout(() => {
          setIsLongWait(true);
        }, 1500);

        await healthAPI.check();
        
        clearTimeout(timer);
        setIsAwake(true);
      } catch (err) {
        console.error('Server wake-up failed:', err);
        // Retry after 2 seconds if it failed
        setTimeout(checkServer, 2000);
      }
    };

    checkServer();
  }, []);

  if (isAwake) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isLongWait ? 'Waking up the server...' : 'Loading...'}
        </h2>
        
        {isLongWait && (
          <p className="text-gray-600 animate-pulse">
            Since we are on a free tier, the server might be sleeping. 
            <br />
            This can take up to a minute. Please wait... 🌸
          </p>
        )}
      </div>
    </div>
  );
};

export default ServerWakeUp;
