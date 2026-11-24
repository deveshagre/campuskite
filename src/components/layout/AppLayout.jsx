import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNavigation from './MobileNavigation';

/**
 * AppLayout - Main application layout shell
 *
 * Structure:
 * - div.app-layout (flex row)
 *   - Sidebar (hidden on mobile via CSS)
 *   - div.app-layout__main (flex column, flex 1)
 *     - Topbar component
 *     - main.app-layout__content (children, with padding)
 *   - MobileNavigation (hidden on desktop via CSS)
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main main-content">
        <Topbar />
        <main className="app-layout__content page-container">
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

export { AppLayout };
