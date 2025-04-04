# NOVA VPN Admin Dashboard

A modern, responsive admin dashboard for VPN management based on the Nova Design system. This dashboard provides a comprehensive interface for managing VPN servers, users, and monitoring system performance.

## Features

- **Modern UI**: Built with the sleek Nova Design system
- **Dark/Light Mode**: Fully themeable interface with automatic theme switching
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Authentication**: Secure login system with token-based authentication
- **Stack-based Navigation**: Easy navigation between features
- **Dashboard Analytics**: Real-time monitoring of VPN performance
- **User Management**: Comprehensive user administration tools
- **Server Management**: Monitor and control VPN servers

## Technology Stack

- React
- SCSS for custom styling
- React Router for navigation
- Chart.js for data visualization
- Feather Icons for consistent iconography
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
vpn-admin-dashboard/
├── public/
│   └── assets/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   └── feature-specific/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   ├── index.js
│   └── routes.js
└── package.json
```

## Login Credentials

For development purposes, you can use:
- Email: admin@example.com
- Password: password123

## License

This project is private and proprietary.
