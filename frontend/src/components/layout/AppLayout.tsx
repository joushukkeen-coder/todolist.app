import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import './AppLayout.css';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-layout__body">
        <Sidebar />
        <main className="app-layout__main">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
