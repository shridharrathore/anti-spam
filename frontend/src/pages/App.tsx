import { Route, Routes } from "react-router-dom";

import Calls from "./Calls";
import Home from "./Home";
import Sms from "./Sms";
import TestLab from "./TestLab";
import { AppShell } from "../components/AppShell";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sms" element={<Sms />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/test" element={<TestLab />} />
      </Routes>
    </AppShell>
  );
}

export default App;
