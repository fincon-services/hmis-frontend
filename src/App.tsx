import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/router';

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
