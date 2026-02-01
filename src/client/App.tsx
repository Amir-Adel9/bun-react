import { AppRouter } from './router';
import { Toaster } from './components/ui/sonner';
import './index.css';

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default App;
