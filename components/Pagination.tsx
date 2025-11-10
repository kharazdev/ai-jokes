// components/Pagination.tsx
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
'use client';

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

// --- HELPER HOOK for Pagination Logic ---
// This hook calculates the page numbers to display, including ellipses
const usePagination = ({
    totalPages,
    currentPage,
    siblingCount = 1,
}: {
    totalPages: number;
    currentPage: number;
    siblingCount?: number;
}) => {
    const DOTS = '...';

    // The hook returns an array of numbers and dots
    const paginationRange = (): (string | number)[] => {
        // Number of pages to show = siblings + first + last + current + 2*DOTS
        const totalPageNumbers = siblingCount + 5;

        // Case 1: If total pages is less than what we want to show, return the full range
        if (totalPageNumbers >= totalPages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        // Case 2: No left dots, but right dots are shown
        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, DOTS, totalPages];
        }

        // Case 3: No right dots, but left dots are shown
        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
            return [firstPageIndex, DOTS, ...rightRange];
        }

        // Case 4: Both left and right dots are shown
        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
            return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
        }

        // Default case (should not happen, but for safety)
        return [];
    };

    return paginationRange();
};


// --- The Pagination Component ---
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
}: PaginationProps) {
    const paginationRange = usePagination({ currentPage, totalPages });

    if (currentPage === 0 || totalPages < 2) {
        return null;
    }

    const baseButtonStyles = "flex items-center justify-center p-2 text-sm font-semibold text-gray-700 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
    const iconStyles = "h-4 w-4";
    const activePageStyles = "!bg-blue-600 !text-white !ring-blue-600";

    return (
        <nav aria-label="Pagination">
            <ul className="flex items-center justify-center gap-2">
                {/* First Page Button */}
                <li>
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || isLoading}
                        className={baseButtonStyles}
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft className={iconStyles} />
                    </button>
                </li>
                {/* Previous Page Button */}
                <li>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className={baseButtonStyles}
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft className={iconStyles} />
                    </button>
                </li>

                {/* Page Number Buttons */}
                {paginationRange.map((pageNumber, index) => {
                    if (typeof pageNumber === 'string') {
                        return <li key={`dots-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            index}`} className="px-2 text-gray-500">...</li>;
                    }
                    return (
                        <li key={pageNumber}>
                            <button
                                onClick={() => onPageChange(pageNumber)}
                                disabled={isLoading}
                                className={`${baseButtonStyles} w-9 h-9 ${pageNumber === currentPage ? activePageStyles : ''}`}
                                aria-current={pageNumber === currentPage ? 'page' : undefined}
                            >
                                {pageNumber}
                            </button>
                        </li>
                    );
                })}

                {/* Next Page Button */}
                <li>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        className={baseButtonStyles}
                        aria-label="Go to next page"
                    >
                        <ChevronRight className={iconStyles} />
                    </button>
                </li>
                {/* Last Page Button */}
                <li>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages || isLoading}
                        className={baseButtonStyles}
                        aria-label="Go to last page"
                    >
                        <ChevronsRight className={iconStyles} />
                    </button>
                </li>
            </ul>
        </nav>
    );
}