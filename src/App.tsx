import "./App.css";
import { Calculator } from "./components/Calculator";

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
      <Calculator />
    </div>
  );
}

export default App;
