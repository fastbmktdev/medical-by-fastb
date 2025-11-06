# Component Tests

## 📋 Overview

Component tests สำหรับทดสอบ React components โดยใช้ **Jest** และ **React Testing Library**

## 📁 Structure

```
component/
├── design-system/
│   ├── primitives/       # Basic components (Button, Input, etc.)
│   └── compositions/     # Complex components (Modal, DataTable, etc.)
└── ...                   # Other component categories
```

## 🚀 Running Tests

### รัน component tests ทั้งหมด
```bash
npm run test:component
```

### รัน design system tests
```bash
npm run test:component:design-system
```

### รัน test file เฉพาะ
```bash
npm test -- tests/component/design-system/primitives/Button.test.tsx
```

## ✅ Test Coverage

### Design System - Primitives (2 tests) ✅
- ✅ **Button.test.tsx** - Button component
- ✅ **BaseInput.test.tsx** - Input component

### Design System - Compositions (2 tests) ✅
- ✅ **Modal.test.tsx** - Modal component
- ✅ **DataTable.test.tsx** - DataTable component

### Missing Component Tests ⏳

#### Forms (High Priority)
- ⏳ SignupForm
- ⏳ LoginForm
- ⏳ BookingForm
- ⏳ PaymentForm
- ⏳ PartnerApplicationForm

#### Layouts (Medium Priority)
- ⏳ Header
- ⏳ Footer
- ⏳ Sidebar
- ⏳ DashboardLayout

#### Features (Medium Priority)
- ⏳ GymCard
- ⏳ PackageCard
- ⏳ BookingCard
- ⏳ AffiliateStats
- ⏳ PromotionBadge

#### UI Elements (Low Priority)
- ⏳ Badge
- ⏳ Card
- ⏳ Dropdown
- ⏳ Tabs
- ⏳ Toast

## 📝 Writing Component Tests

### Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import Button from '@/components/design-system/primitives/Button';

describe('Button Component', () => {
  it('should render with text', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    fireEvent.click(screen.getByText('Click me'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    // Arrange & Act
    render(<Button disabled>Click me</Button>);

    // Assert
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Best Practices
1. Test user interactions, not implementation
2. Use accessible queries (getByRole, getByLabelText)
3. Test different states (default, hover, disabled, loading)
4. Test different variants and sizes
5. Test accessibility (a11y)
6. Test responsive behavior
7. Mock child components if needed
8. Test error states

## 🧪 Testing Patterns

### Testing Forms
```typescript
it('should submit form with valid data', async () => {
  const handleSubmit = jest.fn();
  render(<SignupForm onSubmit={handleSubmit} />);

  // Fill form
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' },
  });

  // Submit
  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

  // Verify
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Async Components
```typescript
it('should load data and display', async () => {
  // Mock API
  jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => ({ data: 'test' }),
  });

  render(<AsyncComponent />);

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

### Testing Modals
```typescript
it('should open and close modal', () => {
  render(<Modal />);

  // Modal should be closed initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // Open modal
  fireEvent.click(screen.getByText('Open Modal'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Close modal
  fireEvent.click(screen.getByText('Close'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

## 🎯 Priority Components to Test

### 🔴 High Priority (Critical UI)
1. SignupForm - User registration
2. LoginForm - User authentication
3. BookingForm - Booking creation
4. PaymentForm - Payment processing
5. Button - Primary UI element
6. Input - Form inputs

### 🟠 Medium Priority
1. GymCard - Gym display
2. PackageCard - Package selection
3. Header - Navigation
4. Footer - Site links
5. Modal - Dialogs
6. DataTable - Data display

### 🟡 Low Priority
1. Badge - Status indicators
2. Card - Content containers
3. Dropdown - Selections
4. Tabs - Content organization
5. Toast - Notifications

## 🔧 Setup & Configuration

### Required Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Setup File
```javascript
// jest.setup.js
import '@testing-library/jest-dom';
```

## ♿ Accessibility Testing

### Using jest-axe
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🐛 Troubleshooting

### Can't find element
- Use `screen.debug()` to see rendered HTML
- Use accessible queries (getByRole, getByLabelText)
- Check if element is in viewport

### Async errors
- Use `waitFor()` for async updates
- Use `findBy` queries for async elements
- Mock async operations

### Event not firing
- Use `fireEvent` or `userEvent`
- Check if element is enabled
- Verify event handler is attached

## 📚 References

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://github.com/nickcolley/jest-axe)
