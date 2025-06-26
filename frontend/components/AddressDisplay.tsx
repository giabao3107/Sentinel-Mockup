import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { AddressDisplayProps } from '@/types';
import { formatAddress, copyToClipboard, cn } from '@/utils';

export default function AddressDisplay({ 
  address, 
  short = false, 
  copyable = false, 
  className 
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copyable) {
      const success = await copyToClipboard(address);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const formattedAddress = formatAddress(address, short);

  if (!copyable) {
    return (
      <span className={cn('font-mono text-gray-700', className)}>
        {formattedAddress}
      </span>
    );
  }

  return (
    <div className={cn('inline-flex items-center space-x-2', className)}>
      <span className="font-mono text-gray-700">
        {formattedAddress}
      </span>
      
      <div className="flex items-center space-x-1">
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
        
        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="View on Etherscan"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
} 