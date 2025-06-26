import { TransactionListProps } from '@/types';
import { formatEther, formatTimeAgo, parseMethodSignature } from '@/utils';
import { ExternalLink, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import AddressDisplay from './AddressDisplay';
import LoadingSpinner from './LoadingSpinner';

export default function TransactionList({ 
  transactions, 
  loading = false, 
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange 
}: TransactionListProps) {
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transaction List */}
      <div className="overflow-hidden">
        {transactions.map((tx, index) => (
          <div 
            key={tx.hash} 
            className={`
              flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0
              hover:bg-gray-50 transition-colors duration-200
            `}
          >
            {/* Left side - Transaction info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Direction indicator */}
              <div className="flex-shrink-0">
                {tx.value_wei > 0 ? (
                  <div className="p-2 bg-green-100 rounded-full">
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-blue-100 rounded-full">
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Transaction details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {parseMethodSignature(tx.method_id)}
                  </span>
                  
                  {tx.is_error && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Failed
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span>From:</span>
                    <AddressDisplay address={tx.from} short className="text-xs" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>To:</span>
                    <AddressDisplay address={tx.to} short className="text-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Value and time */}
            <div className="flex flex-col items-end space-y-1 flex-shrink-0">
              {/* Value */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatEther(tx.value_ether, { decimals: 4 })}
                </div>
                <div className="text-xs text-gray-500">
                  Fee: {formatEther(tx.transaction_fee, { decimals: 6 })}
                </div>
              </div>

              {/* Time and external link */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeAgo(tx.timestamp)}
                </div>
                
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="View transaction on Etherscan"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 