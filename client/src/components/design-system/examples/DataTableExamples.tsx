/**
 * DataTable Component Examples
 * 
 * Visual examples of DataTable component usage for development and testing.
 * This serves as a replacement for Storybook stories until Storybook is set up.
 */

import React, { useState } from 'react';
import { DataTable } from '../../compositions/data/DataTable';
import { TableColumn } from '../../compositions/data/types';
import { Button } from '../primitives/Button';
import { Card, CardHeader, CardContent } from '../primitives/Card';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'partner';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

const sampleUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-14',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'partner',
    status: 'pending',
    lastLogin: '2024-01-10',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'user',
    status: 'inactive',
    lastLogin: '2024-01-05',
  },
];

const columns: TableColumn<User>[] = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
    width: 80,
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    title: 'Email',
    sortable: true,
  },
  {
    key: 'role',
    title: 'Role',
    render: (value) => {
      const roleValue = String(value);
      return (
        <span className={`
          px-2 py-1  text-xs font-medium
          ${roleValue === 'admin' ? 'bg-brand-primary text-white' : ''}
          ${roleValue === 'partner' ? 'bg-semantic-info text-white' : ''}
          ${roleValue === 'user' ? 'bg-background-secondary text-text-secondary' : ''}
        `}>
          {roleValue}
        </span>
      );
    },
  },
  {
    key: 'status',
    title: 'Status',
    render: (value) => {
      const statusValue = String(value);
      return (
        <span className={`
          px-2 py-1  text-xs font-medium
          ${statusValue === 'active' ? 'bg-semantic-success text-white' : ''}
          ${statusValue === 'inactive' ? 'bg-semantic-error text-white' : ''}
          ${statusValue === 'pending' ? 'bg-semantic-warning text-white' : ''}
        `}>
          {statusValue}
        </span>
      );
    },
  },
  {
    key: 'lastLogin',
    title: 'Last Login',
    sortable: true,
  },
  {
    key: 'actions',
    title: 'Actions',
    render: (_, record) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" aria-label={`Edit ${record.name}`}>
          Edit
        </Button>
        <Button size="sm" variant="danger" aria-label={`Delete ${record.name}`}>
          Delete
        </Button>
      </div>
    ),
  },
];

export const DataTableExamples: React.FC = () => {
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
    console.log(`Sort by ${key} in ${order} order`);
  };

  const handleRowClick = (record: User, index: number) => {
    console.log(`Clicked on ${record.name} (row ${index})`);
  };

  const largeDataset = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['admin', 'user', 'partner'][i % 3] as User['role'],
    status: ['active', 'inactive', 'pending'][i % 3] as User['status'],
    lastLogin: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
  }));

  const minimalColumns: TableColumn<User>[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'status', title: 'Status' },
  ];

  const alignedColumns: TableColumn<User>[] = [
    { key: 'id', title: 'ID', align: 'center', width: 80 },
    { key: 'name', title: 'Name', align: 'left' },
    { key: 'email', title: 'Email', align: 'left' },
    { key: 'status', title: 'Status', align: 'center' },
    { key: 'lastLogin', title: 'Last Login', align: 'right' },
  ];

  return (
    <div className="p-6 space-y-8 bg-background-primary min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          DataTable Component Examples
        </h1>

        {/* Basic Table */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Basic DataTable</h2>
            <p className="text-text-secondary">Standard table with all features</p>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={sampleUsers} />
          </CardContent>
        </Card>

        {/* Loading State */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Loading State</h2>
            <p className="text-text-secondary">Table showing loading indicator</p>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={[]} loading={true} />
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Empty State</h2>
            <p className="text-text-secondary">Table with custom empty message</p>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns} 
              data={[]} 
              emptyText="No users found. Try adjusting your search criteria." 
            />
          </CardContent>
        </Card>

        {/* Clickable Rows */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Clickable Rows</h2>
            <p className="text-text-secondary">Click on any row to see console output</p>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns} 
              data={sampleUsers} 
              onRowClick={handleRowClick}
            />
          </CardContent>
        </Card>

        {/* With Sorting */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">With Sorting</h2>
            <p className="text-text-secondary">Table with sorting functionality</p>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns} 
              data={sampleUsers}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </CardContent>
        </Card>

        {/* Large Dataset */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Large Dataset</h2>
            <p className="text-text-secondary">Table with 50 rows to test performance</p>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={largeDataset} />
          </CardContent>
        </Card>

        {/* Custom Alignment */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Custom Column Alignment</h2>
            <p className="text-text-secondary">Columns with different text alignments</p>
          </CardHeader>
          <CardContent>
            <DataTable columns={alignedColumns} data={sampleUsers} />
          </CardContent>
        </Card>

        {/* Minimal Columns */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Minimal Columns</h2>
            <p className="text-text-secondary">Table with only essential columns</p>
          </CardHeader>
          <CardContent>
            <DataTable columns={minimalColumns} data={sampleUsers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataTableExamples;