import React from 'react';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-blue-600 text-white z-50 h-10 flex items-center justify-center shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Mail size={16} />
        <span>Contact: circuitstudiomessage@gmail.com</span>
      </div>
    </footer>
  );
};

export default Footer;
