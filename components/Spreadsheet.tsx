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

  const [rows, setRows] = useState<Row[]>(Array.from({ length: 5 }, () => ({ ...emptyRow })));
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Sheet</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="view-select">
            View:
          </label>
          <select
            id="view-select"
            value={view}
            onChange={(e) => setView(e.target.value as keyof typeof views)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900"
          >
            {Object.entries(views).map(([key, v]) => (
              <option key={key} value={key}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            onClick={addRow}
            className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Row
          </button>
        </div>
      </div>
      <div className="overflow-auto border border-gray-300 rounded">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className="bg-gray-100 dark:bg-neutral-800 border-b border-gray-300 px-2 py-1 text-left font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="odd:bg-white even:bg-gray-50 dark:odd:bg-neutral-900 dark:even:bg-neutral-800"
              >
                {visibleColumns.map((col) => (
                  <td key={col.id} className="border-t border-gray-200 text-left">
                    <input
                      className="w-full px-2 py-1 text-left focus:outline-none bg-transparent"
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

