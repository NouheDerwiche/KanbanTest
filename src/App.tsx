import { KanbanBoard } from "./features/board/components";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

function App() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <KanbanBoard />
      <Toaster />
    </div>
  );
}

export default App;
