import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        {children}
      </main>
    </>
  );
};
