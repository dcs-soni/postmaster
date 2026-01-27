import { MainLayout } from "./components/layout/MainLayout";
import { RequestProvider } from "./contexts/RequestContext";

function App() {
  return (
    <RequestProvider>
      <MainLayout />
    </RequestProvider>
  );
}

export default App;
