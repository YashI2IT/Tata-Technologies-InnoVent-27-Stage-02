import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Inspection } from "./pages/Inspection";
import { Analysis } from "./pages/Analysis";
import { Manuals } from "./pages/Manuals";
import { Recommendation } from "./pages/Recommendation";
import { DigitalTwin } from "./pages/DigitalTwin";
import { Reports } from "./pages/Reports";
import { Result } from "./pages/Result";
import { Analytics } from "./pages/Analytics";
import { InspectionProvider } from "./hooks/useInspection";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Login } from "./pages/Login";

function App() {
  return (
    <AuthProvider>
      <InspectionProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="inspection" element={<Inspection />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="manuals" element={<Manuals />} />
              <Route path="recommendation" element={<Recommendation />} />
              <Route path="digital-twin" element={<DigitalTwin />} />
              <Route path="reports" element={<Reports />} />
              <Route path="result" element={<Result />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="*" element={<div className="p-8">Page not found</div>} />
            </Route>
          </Routes>
        </Router>
      </InspectionProvider>
    </AuthProvider>
  );
}

export default App;
