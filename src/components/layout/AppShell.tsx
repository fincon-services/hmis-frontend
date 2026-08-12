import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthorizationHydration } from '@/app/guards/useAuthorizationHydration';
import { RouteScreenGuard } from '@/app/guards/RouteScreenGuard';

const { Content } = Layout;

export function AppShell() {
  useAuthorizationHydration();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content>
          <RouteScreenGuard />
        </Content>
      </Layout>
    </Layout>
  );
}
