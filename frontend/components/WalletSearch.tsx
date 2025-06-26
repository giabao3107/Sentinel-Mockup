import { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { WalletSearchProps } from '@/types';
import { isValidEthereumAddress } from '@/utils';
import LoadingSpinner from './LoadingSpinner';

export default function WalletSearch({ onSearch, loading = false, disabled = false }: WalletSearchProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!isValidEthereumAddress(address.trim())) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setError('');
    onSearch(address.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    if (error) {
      setError('');
    }
  };

  const isFormDisabled = loading || disabled;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            type="text"
            value={address}
            onChange={handleInputChange}
            disabled={isFormDisabled}
            placeholder="Enter Ethereum wallet address (0x...)"
            className={`
              block w-full pl-12 pr-4 py-4 text-lg text-black border rounded-xl shadow-sm
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-colors duration-200
              ${error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
              }
              ${isFormDisabled 
                ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                : 'bg-white hover:border-gray-400'
              }
            `}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isFormDisabled}
            className={`
              inline-flex items-center px-8 py-3 text-lg font-medium rounded-xl
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isFormDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Analyzing Wallet...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Analyze Wallet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 