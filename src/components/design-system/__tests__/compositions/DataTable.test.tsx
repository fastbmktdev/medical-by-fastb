/**
 * DataTable Component Tests
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { DataTable } from '../../../compositions/data/DataTable';
import { TableColumn } from '../../../compositions/data/types';
import { render, expectComponentToRender, cleanup } from '../setup';
import { Button } from '../../primitives/Button';

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
];

const basicColumns: TableColumn<User>[] = [
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
    render: (value) => (
      <span className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${value === 'admin' ? 'bg-brand-primary text-white' : ''}
        ${value === 'partner' ? 'bg-semantic-info text-white' : ''}
        ${value === 'user' ? 'bg-background-secondary text-text-secondary' : ''}
      `}>
        {value}
      </span>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    render: (value) => (
      <span className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${value === 'active' ? 'bg-semantic-success text-white' : ''}
        ${value === 'inactive' ? 'bg-semantic-error text-white' : ''}
        ${value === 'pending' ? 'bg-semantic-warning text-white' : ''}
      `}>
        {value}
      </span>
    ),
  },
];

const columnsWithActions: TableColumn<User>[] = [
  ...basicColumns,
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

describe('DataTable Component', () => {
  afterEach(cleanup);

  describe('Rendering', () => {
    it('renders correctly with basic data', () => {
      expectComponentToRender(
        <DataTable columns={basicColumns} data={sampleUsers} />
      );
    });

    it('renders table headers correctly', () => {
      render(<DataTable columns={basicColumns} data={sampleUsers} />);
      
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders table data correctly', () => {
      render(<DataTable columns={basicColumns} data={sampleUsers} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders custom cell content', () => {
      render(<DataTable columns={basicColumns} data={sampleUsers} />);
      
      // Check that role badges are rendered
      const adminBadge = screen.getByText('admin');
      const userBadge = screen.getByText('user');
      const partnerBadge = screen.getByText('partner');
      
      expect(adminBadge).toBeInTheDocument();
      expect(userBadge).toBeInTheDocument();
      expect(partnerBadge).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state correctly', () => {
      render(<DataTable columns={basicColumns} data={[]} loading={true} />);
      
      // Assuming your DataTable shows a loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state with custom message', () => {
      const emptyMessage = 'No users found. Try adjusting your search criteria.';
      render(
        <DataTable 
          columns={basicColumns} 
          data={[]} 
          emptyText={emptyMessage}
        />
      );
      
      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    });

    it('shows default empty state when no custom message provided', () => {
      render(<DataTable columns={basicColumns} data={[]} />);
      
      // Assuming your DataTable has a default empty message
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onRowClick when row is clicked', () => {
      const onRowClick = jest.fn();
      render(
        <DataTable 
          columns={basicColumns} 
          data={sampleUsers} 
          onRowClick={onRowClick}
        />
      );
      
      // Click on the first row (assuming rows are clickable)
      const firstRow = screen.getByText('John Doe').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
        expect(onRowClick).toHaveBeenCalledWith(sampleUsers[0], 0);
      }
    });

    it('handles action button clicks', () => {
      render(<DataTable columns={columnsWithActions} data={sampleUsers} />);
      
      const editButtons = screen.getAllByLabelText(/edit/i);
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      
      expect(editButtons).toHaveLength(sampleUsers.length);
      expect(deleteButtons).toHaveLength(sampleUsers.length);
      
      // Test that buttons are clickable
      fireEvent.click(editButtons[0]);
      fireEvent.click(deleteButtons[0]);
    });
  });

  describe('Sorting', () => {
    it('calls onSort when sortable column header is clicked', () => {
      const onSort = jest.fn();
      render(
        <DataTable 
          columns={basicColumns} 
          data={sampleUsers}
          onSort={onSort}
        />
      );
      
      // Click on sortable column header
      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);
      
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('shows sort indicators for sorted columns', () => {
      render(
        <DataTable 
          columns={basicColumns} 
          data={sampleUsers}
          sortBy="name"
          sortOrder="asc"
        />
      );
      
      // Check for sort indicator (assuming your component shows one)
      const nameHeader = screen.getByText('Name');
      expect(nameHeader.closest('th')).toHaveClass(/sort/i);
    });
  });

  describe('Column Configuration', () => {
    it('applies custom column widths', () => {
      render(<DataTable columns={basicColumns} data={sampleUsers} />);
      
      // Check that ID column has the specified width
      const idHeader = screen.getByText('ID').closest('th');
      expect(idHeader).toHaveStyle({ width: '80px' });
    });

    it('handles columns with custom alignment', () => {
      const alignedColumns: TableColumn<User>[] = [
        { key: 'id', title: 'ID', align: 'center' },
        { key: 'name', title: 'Name', align: 'left' },
        { key: 'email', title: 'Email', align: 'right' },
      ];
      
      render(<DataTable columns={alignedColumns} data={sampleUsers} />);
      
      const idHeader = screen.getByText('ID').closest('th');
      const nameHeader = screen.getByText('Name').closest('th');
      const emailHeader = screen.getByText('Email').closest('th');
      
      expect(idHeader).toHaveClass(/center/i);
      expect(nameHeader).toHaveClass(/left/i);
      expect(emailHeader).toHaveClass(/right/i);
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ['admin', 'user', 'partner'][i % 3] as User['role'],
        status: ['active', 'inactive', 'pending'][i % 3] as User['status'],
        lastLogin: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
      }));
      
      const startTime = performance.now();
      render(<DataTable columns={basicColumns} data={largeDataset} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should render all rows
      expect(screen.getAllByText(/User \d+/)).toHaveLength(100);
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      render(<DataTable columns={basicColumns} data={sampleUsers} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(basicColumns.length);
      
      const rows = screen.getAllByRole('row');
      // +1 for header row
      expect(rows).toHaveLength(sampleUsers.length + 1);
    });

    it('has accessible action buttons', () => {
      render(<DataTable columns={columnsWithActions} data={sampleUsers} />);
      
      const editButtons = screen.getAllByLabelText(/edit/i);
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      
      editButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
      
      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation', () => {
      render(<DataTable columns={columnsWithActions} data={sampleUsers} />);
      
      const firstEditButton = screen.getAllByLabelText(/edit/i)[0];
      firstEditButton.focus();
      expect(firstEditButton).toHaveFocus();
      
      // Test tab navigation
      fireEvent.keyDown(firstEditButton, { key: 'Tab' });
      const firstDeleteButton = screen.getAllByLabelText(/delete/i)[0];
      expect(firstDeleteButton).toHaveFocus();
    });
  });
});