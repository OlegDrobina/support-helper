import Header from "./Components/Header/Header.jsx";
import TraceAnalyzer from "./Components/TraceAnalyzer/TraceAnalyzer.jsx";
import SchedulerLogAnalyzer from "./Components/SchedulerLogAnalyzer/SchedulerLogAnalyzer.jsx";
import GSSettingValueFormer from "./Components/GSSettingValueFormer/GSSettingValueFormer.jsx";
import UsefulLinks from "./Components/UsefulLinks/UsefulLinks.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

function App() {
  return (
    <>
      <ErrorBoundary>
        <BrowserRouter>
          <Box sx={{ display: "flex" }}>
            <Header />
            <Box component='main' sx={{ flexGrow: 1, p: 3 }}>
              <Routes>
                <Route
                  path='/gsvalueformer'
                  element={<GSSettingValueFormer />}
                />
                <Route path='/traceanalyzer' element={<TraceAnalyzer />} />
                <Route
                  path='/schedulerloganalyzer'
                  element={<SchedulerLogAnalyzer />}
                />
                <Route path='/usefullinks' element={<UsefulLinks />} />
              </Routes>
            </Box>
          </Box>
        </BrowserRouter>
      </ErrorBoundary>
    </>
  );
}

export default App;
