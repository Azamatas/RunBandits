import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute, { PublicOnlyRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import AddActivity from "./pages/AddActivity";
import ActivityDetail from "./pages/ActivityDetail";
import EditActivity from "./pages/EditActivity";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Social from "./pages/Social";
import CommonActivities from "./pages/CommonActivities";
import CommonActivityDetail from "./pages/CommonActivityDetail";
import CreateCommonActivity from "./pages/CreateCommonActivity";
import Segments from "./pages/Segments";
import SegmentDetail from "./pages/SegmentDetail";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/add-activity" element={<ProtectedRoute><AddActivity /></ProtectedRoute>} />
        <Route path="/add-common-activity" element={<ProtectedRoute><CreateCommonActivity /></ProtectedRoute>} />
        <Route path="/activities/:id" element={<ProtectedRoute><ActivityDetail /></ProtectedRoute>} />
        <Route path="/activities/:id/edit" element={<ProtectedRoute><EditActivity /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
        <Route path="/common-activities" element={<ProtectedRoute><CommonActivities /></ProtectedRoute>} />
        <Route path="/common-activities/:id" element={<ProtectedRoute><CommonActivityDetail /></ProtectedRoute>} />
        <Route path="/segments" element={<ProtectedRoute><Segments /></ProtectedRoute>} />
        <Route path="/segments/:id" element={<ProtectedRoute><SegmentDetail /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  );
}
