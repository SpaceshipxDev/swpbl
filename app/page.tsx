"use client" 
import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
// import './index.css';

// Define the structure of our data
interface CellContent {
  type: 'text' | 'image';
  value: string;
}

interface RowData {
  id: string;
  [key: string]: string | CellContent;
}

// Define tab configurations
interface TabConfig {
  id: string;
  name: string;
  columns: string[];
  columnLabels: { [key: string]: string };
}

const App: React.FC = () => {
  // Tab configurations
  const tabs: TabConfig[] = [
    {
      id: 'full',
      name: 'Full View',
      columns: ['item', 'name', 'brand', 'cost', 'price', 'quantity'],
      columnLabels: {
        item: 'Item',
        name: 'Name',
        brand: 'Brand',
        cost: 'Cost',
        price: 'Price',
        quantity: 'Quantity'
      }
    },
    {
      id: 'summary',
      name: 'Summary View',
      columns: ['name', 'price'],
      columnLabels: {
        name: 'Name',
        price: 'Price'
      }
    },
    {
      id: 'inventory',
      name: 'Inventory',
      columns: ['item', 'brand', 'quantity'],
      columnLabels: {
        item: 'Item',
        brand: 'Brand',
        quantity: 'Quantity'
      }
    },
    {
      id: 'pricing',
      name: 'Pricing',
      columns: ['name', 'cost', 'price'],
      columnLabels: {
        name: 'Name',
        cost: 'Cost',
        price: 'Price'
      }
    }
  ];

  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<RowData[]>(() => {
    // Initialize with 100 empty rows
    return Array.from({ length: 100 }, (_, i) => ({
      id: `row-${i}`,
      item: { type: 'text', value: '' } as CellContent,
      name: { type: 'text', value: '' } as CellContent,
      brand: { type: 'text', value: '' } as CellContent,
      cost: { type: 'text', value: '' } as CellContent,
      price: { type: 'text', value: '' } as CellContent,
      quantity: { type: 'text', value: '' } as CellContent
    }));
  });

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ start: { row: number; col: number }; end: { row: number; col: number } } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [copiedContent, setCopiedContent] = useState<CellContent | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTab = tabs[activeTab];
  const visibleColumns = currentTab.columns;

  // Generate column letters (A, B, C, ..., Z, AA, AB, ...)
  const getColumnLetter = (index: number): string => {
    let letter = '';
    let current = index;
    while (current >= 0) {
      letter = String.fromCharCode(65 + (current % 26)) + letter;
      current = Math.floor(current / 26) - 1;
    }
    return letter;
  };

  // Get cell content safely
  const getCellContent = (row: number, col: string): CellContent => {
    const cell = data[row][col];
    if (typeof cell === 'object' && cell !== null) {
      return cell as CellContent;
    }
    return { type: 'text', value: String(cell || '') };
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - enter edit mode
      const columnKey = visibleColumns[col];
      const content = getCellContent(row, columnKey);
      if (content.type === 'text') {
        setEditingCell({ row, col });
        setCellValue(content.value);
        setSelectedCell({ row, col });
        setSelectedRange(null);
      }
    } else {
      // Single click
      if (e.shiftKey && selectedCell) {
        // Shift click - select range
        setSelectedRange({
          start: selectedCell,
          end: { row, col }
        });
      } else {
        setSelectedCell({ row, col });
        setEditingCell(null);
        setSelectedRange(null);
      }
    }
  };

  // Handle paste
  const handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();

    if (!selectedCell) return;

    const items = e.clipboardData.items;
    const columnKey = visibleColumns[selectedCell.col];

    // Check for images
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const newData = [...data];
            newData[selectedCell.row] = {
              ...newData[selectedCell.row],
              [columnKey]: { type: 'image', value: e.target?.result as string }
            };
            setData(newData);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }

    // Handle text paste
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      const newData = [...data];
      newData[selectedCell.row] = {
        ...newData[selectedCell.row],
        [columnKey]: { type: 'text', value: text }
      };
      setData(newData);
    }
  };

  // Handle copy
  const handleCopy = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCell) {
      const columnKey = visibleColumns[selectedCell.col];
      const content = getCellContent(selectedCell.row, columnKey);
      setCopiedContent(content);

      // Also copy to system clipboard if it's text
      if (content.type === 'text' && content.value) {
        navigator.clipboard.writeText(content.value);
      }
    }
  };

  // Handle paste from keyboard
  const handlePasteKeyboard = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedCell && copiedContent) {
      const columnKey = visibleColumns[selectedCell.col];
      const newData = [...data];
      newData[selectedCell.row] = {
        ...newData[selectedCell.row],
        [columnKey]: { ...copiedContent }
      };
      setData(newData);
    }
  };

  // Handle cell mouse down for range selection
  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelectedCell({ row, col });
    setSelectedRange({
      start: { row, col },
      end: { row, col }
    });
  };

  // Handle cell mouse enter for range selection
  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting && selectedCell) {
      setSelectedRange({
        start: selectedCell,
        end: { row, col }
      });
    }
  };

  // Handle mouse up
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle cell value change
  const handleCellChange = (value: string) => {
    setCellValue(value);
  };

  // Save cell value
  const saveCellValue = () => {
    if (editingCell) {
      const columnKey = visibleColumns[editingCell.col];
      const newData = [...data];
      newData[editingCell.row] = {
        ...newData[editingCell.row],
        [columnKey]: { type: 'text', value: cellValue }
      };
      setData(newData);
      setEditingCell(null);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle copy
    handleCopy(e);
    handlePasteKeyboard(e);

    if (!selectedCell) return;

    const { row, col } = selectedCell;

    switch (e.key) {
      case 'Enter':
        if (editingCell) {
          saveCellValue();
          if (row < data.length - 1) {
            setSelectedCell({ row: row + 1, col });
          }
        } else {
          const columnKey = visibleColumns[col];
          const content = getCellContent(row, columnKey);
          if (content.type === 'text') {
            setEditingCell({ row, col });
            setCellValue(content.value);
          }
        }
        break;
      case 'Escape':
        if (editingCell) {
          setEditingCell(null);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (editingCell) {
          saveCellValue();
        }
        if (e.shiftKey) {
          if (col > 0) {
            setSelectedCell({ row, col: col - 1 });
          } else if (row > 0) {
            setSelectedCell({ row: row - 1, col: visibleColumns.length - 1 });
          }
        } else {
          if (col < visibleColumns.length - 1) {
            setSelectedCell({ row, col: col + 1 });
          } else if (row < data.length - 1) {
            setSelectedCell({ row: row + 1, col: 0 });
          }
        }
        break;
      case 'ArrowUp':
        if (!editingCell && row > 0) {
          setSelectedCell({ row: row - 1, col });
        }
        break;
      case 'ArrowDown':
        if (!editingCell && row < data.length - 1) {
          setSelectedCell({ row: row + 1, col });
        }
        break;
      case 'ArrowLeft':
        if (!editingCell && col > 0) {
          setSelectedCell({ row, col: col - 1 });
        }
        break;
      case 'ArrowRight':
        if (!editingCell && col < visibleColumns.length - 1) {
          setSelectedCell({ row, col: col + 1 });
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!editingCell) {
          const columnKey = visibleColumns[col];
          const newData = [...data];
          newData[row] = {
            ...newData[row],
            [columnKey]: { type: 'text', value: '' }
          };
          setData(newData);
        }
        break;
      default:
        // Start typing in a cell
        if (!editingCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const columnKey = visibleColumns[col];
          const content = getCellContent(row, columnKey);
          if (content.type === 'text') {
            setEditingCell({ row, col });
            setCellValue(e.key);
          }
        }
        break;
    }
  };

  // Check if a cell is selected
  const isCellSelected = (row: number, col: number) => {
    if (selectedRange) {
      const minRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const minCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col);
      return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    }
    return selectedCell?.row === row && selectedCell?.col === col;
  };

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Get selected cell address
  const getSelectedCellAddress = () => {
    if (selectedCell) {
      return `${getColumnLetter(selectedCell.col)}${selectedCell.row + 1}`;
    }
    return '';
  };

  // Get selected cell value for formula bar
  const getFormulaBarValue = () => {
    if (selectedCell && !editingCell) {
      const columnKey = visibleColumns[selectedCell.col];
      const content = getCellContent(selectedCell.row, columnKey);
      return content.type === 'text' ? content.value : '[Image]';
    }
    return cellValue;
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Header */}
      <div className="border-b border-gray-300 bg-white">
        <div className="flex items-center h-12 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#0F9D58" strokeWidth="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="#0F9D58" strokeWidth="2"/>
                <line x1="3" y1="15" x2="21" y2="15" stroke="#0F9D58" strokeWidth="2"/>
                <line x1="9" y1="3" x2="9" y2="21" stroke="#0F9D58" strokeWidth="2"/>
                <line x1="15" y1="3" x2="15" y2="21" stroke="#0F9D58" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-base font-medium text-gray-800">Swap Tables</div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-xs text-gray-500">Auto-saved</span>
          </div>
        </div>
      </div>

      {/* Simplified Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center h-9 px-4 space-x-2">
          <button className="p-1.5 hover:bg-gray-200 rounded" title="Undo">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button className="p-1.5 hover:bg-gray-200 rounded" title="Redo">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-300" />
          <button className="p-1.5 hover:bg-gray-200 rounded" title="Copy">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-1.5 hover:bg-gray-200 rounded" title="Paste">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-300" />
          <button className="p-1.5 hover:bg-gray-200 rounded" title="Clear Formatting">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </button>
          <div className="ml-auto text-xs text-gray-500">
            {copiedContent && <span className="mr-2">Copied: {copiedContent.type === 'text' ? copiedContent.value.substring(0, 20) : '[Image]'}</span>}
          </div>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="border-b border-gray-200 bg-white flex items-center h-7 px-2">
        <div className="w-16 text-center text-xs border-r border-gray-200 pr-2 mr-2 font-medium text-gray-700">
          {getSelectedCellAddress()}
        </div>
        <div className="text-gray-400 mr-2 text-xs">fx</div>
        <input
          type="text"
          className="flex-1 outline-none text-xs px-1"
          value={getFormulaBarValue()}
          onChange={(e) => {
            if (selectedCell) {
              const columnKey = visibleColumns[selectedCell.col];
              const newData = [...data];
              newData[selectedCell.row] = {
                ...newData[selectedCell.row],
                [columnKey]: { type: 'text', value: e.target.value }
              };
              setData(newData);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && selectedCell) {
              const { row, col } = selectedCell;
              if (row < data.length - 1) {
                setSelectedCell({ row: row + 1, col });
              }
            }
          }}
        />
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto relative" ref={gridRef} onPaste={handlePaste}>
        <div className="inline-block min-w-full">
          <table className="border-collapse" onKeyDown={handleKeyDown} tabIndex={0}>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-gray-50 border border-gray-300 w-10 h-7 text-xs font-normal text-gray-600" />
                {visibleColumns.map((_, index) => (
                  <th
                    key={`col-${index}`}
                    className="sticky top-0 z-10 bg-gray-50 border border-gray-300 w-28 h-7 text-xs font-normal text-gray-600"
                  >
                    {getColumnLetter(index)}
                  </th>
                ))}
                {/* Extra columns for visual completeness */}
                {Array.from({ length: Math.max(0, 20 - visibleColumns.length) }).map((_, index) => (
                  <th
                    key={`extra-col-${index}`}
                    className="sticky top-0 z-10 bg-gray-50 border border-gray-300 w-28 h-7 text-xs font-normal text-gray-400"
                  >
                    {getColumnLetter(visibleColumns.length + index)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky top-7 left-0 z-20 bg-white border border-gray-300 w-10 h-6 text-xs font-normal text-gray-600" />
                {visibleColumns.map((col, index) => (
                  <th
                    key={`header-${col}`}
                    className="sticky top-7 z-10 bg-gray-100 border border-gray-300 w-28 h-6 text-xs font-semibold text-gray-700 px-2"
                  >
                    {currentTab.columnLabels[col]}
                  </th>
                ))}
                {/* Extra columns */}
                {Array.from({ length: Math.max(0, 20 - visibleColumns.length) }).map((_, index) => (
                  <th
                    key={`extra-header-${index}`}
                    className="sticky top-7 z-10 bg-gray-100 border border-gray-300 w-28 h-6"
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-10 bg-gray-50 border border-gray-300 w-10 h-7 text-xs text-center text-gray-600 font-medium">
                    {rowIndex + 1}
                  </td>
                  {visibleColumns.map((col, colIndex) => {
                    const content = getCellContent(rowIndex, col);
                    return (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`border border-gray-300 w-28 h-7 p-0 text-xs relative ${
                          isCellSelected(rowIndex, colIndex)
                            ? 'ring-2 ring-blue-500 ring-inset bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      >
                        {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className="w-full h-full outline-none bg-white px-1 text-xs"
                            value={cellValue}
                            onChange={(e) => handleCellChange(e.target.value)}
                            onBlur={saveCellValue}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveCellValue();
                                if (rowIndex < data.length - 1) {
                                  setSelectedCell({ row: rowIndex + 1, col: colIndex });
                                }
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              } else if (e.key === 'Tab') {
                                e.preventDefault();
                                saveCellValue();
                                if (colIndex < visibleColumns.length - 1) {
                                  setSelectedCell({ row: rowIndex, col: colIndex + 1 });
                                }
                              }
                            }}
                          />
                        ) : content.type === 'image' ? (
                          <div className="w-full h-full p-0.5 flex items-center justify-center">
                            <img src={content.value} alt="" className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="truncate px-1 leading-7">{content.value}</div>
                        )}
                      </td>
                    );
                  })}
                  {/* Extra empty columns */}
                  {Array.from({ length: Math.max(0, 20 - visibleColumns.length) }).map((_, index) => (
                    <td
                      key={`extra-cell-${rowIndex}-${index}`}
                      className="border border-gray-300 w-28 h-7 px-1 text-xs hover:bg-gray-50"
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="border-t border-gray-300 bg-gray-50 flex items-center h-9">
        <button className="p-1.5 hover:bg-gray-200 rounded ml-2" title="Add Sheet">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="flex ml-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`px-3 py-1 text-xs border-r border-gray-300 transition-colors ${
                activeTab === index
                  ? 'bg-white border-b-2 border-b-blue-500 font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              onClick={() => setActiveTab(index)}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="ml-auto mr-4 text-xs text-gray-500">
          {data.length} rows
        </div>
      </div>
    </div>
  );
};

export default App;
