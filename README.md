# SaniShop - Point of Sale Desktop Application

A comprehensive offline-first Point of Sale (POS) and management desktop application built with Electron, React, and modern web technologies.

## 🚀 Features

### Core Functionality
- **Secure Login System** - Username/password authentication with session management
- **Dashboard** - Real-time overview of sales, revenue, customers, and inventory alerts
- **Inventory Management** - Complete CRUD operations for products and categories
- **Point of Sale** - Full-featured POS with cart, discount, payment processing
- **Customer Management** - Customer database with credit tracking
- **Sales History** - Complete transaction history with custom date filtering
- **Reports & Analytics** - Sales and inventory reports with date range filtering
- **Settings** - Shop configuration, language switching, theme management

### Technical Features
- **Offline-First** - Works completely offline with local data storage
- **Multilingual** - Full English/Urdu language support including PDF receipts
- **PDF Generation** - Professional receipts with shop branding
- **Dark/Light Theme** - Complete theme switching with persistence
- **Responsive Design** - Optimized for desktop use with clean, modern UI
- **Production Ready** - Built with TypeScript, proper error handling, and validation

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron with secure IPC
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS with dark mode support
- **Internationalization**: i18next with React integration
- **PDF Generation**: jsPDF for receipt generation
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tools**: Electron Builder for distribution

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd sanishop

# Install dependencies
npm install

# Start development server (web version)
npm run dev

# Start Electron development
npm run electron-dev
```

### Building for Production
```bash
# Build web version
npm run build

# Build Electron app for current platform
npm run electron-pack

# Build distributables for all platforms
npm run dist
```

## 🔐 Default Login Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Cashier**: username: `cashier`, password: `cash123`

## 📱 Application Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Layout components (Sidebar, Header)
├── pages/              # Main application pages
├── stores/             # Zustand state management
├── utils/              # Utility functions (PDF generation)
├── i18n/               # Internationalization files
└── App.tsx             # Main application component

public/
├── electron.js         # Electron main process
├── preload.js          # Electron preload script
└── assets/             # Static assets
```

## 🌟 Key Features Explained

### POS System
- Add products to cart with quantity adjustment
- Apply discounts and handle multiple payment methods
- Calculate change automatically
- Generate PDF receipts instantly
- Support for walk-in customers and registered customers

### Inventory Management
- Single name field for products (supports any language)
- Category-based organization
- Stock tracking with low-stock alerts
- Barcode support for quick product lookup
- Cost and pricing management

### Reporting System
- Custom date range filtering
- Sales analytics with payment method breakdown
- Top-selling products analysis
- Inventory reports with stock alerts
- Revenue tracking and trends

### Multilingual Support
- Complete UI translation (English/Urdu)
- PDF receipts in selected language
- RTL text support for Urdu
- Persistent language preferences

## 🔧 Configuration

### Shop Settings
Configure your shop information in Settings:
- Shop name (English/Urdu)
- Address (English/Urdu)  
- Phone number
- Email address

These details appear in:
- Application navbar
- PDF receipts
- Customer communications

### Theme & Language
- Toggle between light/dark themes
- Switch between English/Urdu languages
- All preferences are automatically saved

## 📄 PDF Receipts

Professional receipts include:
- Shop branding and contact information
- Sale details (date, receipt number, cashier)
- Customer information
- Itemized product list
- Subtotal, discount, and final amount
- Amount paid and change given
- Payment method
- Return policy information

## 🚀 Deployment

### Electron Distribution
The app can be packaged for:
- **Windows**: NSIS installer
- **macOS**: DMG package
- **Linux**: AppImage

### Web Deployment
Can also be deployed as a web application to any static hosting service.

## 🔒 Security Features

- Password hashing simulation (ready for bcrypt integration)
- Secure Electron IPC with context isolation
- No remote module access
- Preload script for safe API exposure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

---

Built with ❤️ for small businesses and retail shops.