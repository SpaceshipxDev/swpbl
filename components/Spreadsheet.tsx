'use client';

import { useState } from 'react';

interface Column {
  id: string;
  label: string;
}

interface Row {
  [key: string]: string;
}

const allColumns: Column[] = [
  { id: 'item', label: 'Item' },
  { id: 'name', label: 'Name' },
  { id: 'process', label: 'Process' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'price', label: 'Price' },
];

const views = {
  full: { name: 'Full', columns: ['item', 'name', 'process', 'quantity', 'price'] },
  summary: { name: 'Summary', columns: ['item', 'quantity', 'price'] },
};

export default function Spreadsheet() {
  const emptyRow: Row = {
    item: '',
    name: '',
    process: '',
    quantity: '',
    price: '',
  };

  const [rows, setRows] = useState<Row[]>(Array.from({ length: 20 }, () => ({ ...emptyRow })));
  const [view, setView] = useState<keyof typeof views>('full');

  const visibleColumns = allColumns.filter((c) => views[view].columns.includes(c.id));

  const handleCellChange = (rowIndex: number, columnId: string, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [columnId]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="view-select" className="text-gray-600">
            View
          </label>
          <select
            id="view-select"
            value={view}
            onChange={(e) => setView(e.target.value as keyof typeof views)}
            className="border border-gray-300 rounded px-1 py-0.5 bg-white dark:bg-neutral-900"
          >
            {Object.entries(views).map(([key, v]) => (
              <option key={key} value={key}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addRow}
          className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + Row
        </button>
      </div>
      <div className="overflow-auto border border-gray-300 rounded">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-100 dark:bg-neutral-800 border-r border-gray-300 w-8"></th>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className="bg-gray-100 dark:bg-neutral-800 border-b border-r border-gray-300 px-2 py-1 text-left font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-gray-50 dark:even:bg-neutral-900">
                <th className="sticky left-0 z-10 bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 text-center font-normal">
                  {rowIndex + 1}
                </th>
                {visibleColumns.map((col) => (
                  <td key={col.id} className="border-r border-b border-gray-300">
                    <input
                      className="w-full px-2 py-1 focus:outline-none"
                      value={row[col.id] || ''}
                      onChange={(e) => handleCellChange(rowIndex, col.id, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

