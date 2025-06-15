import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { Toolbar, Grid } from '@mui/material';

import Login from './pages/Login/Login.jsx';
import CreateTest from './pages/CreateTest/CreateTest.jsx';
import WriteTest from './pages/TakeTest/TakeTest.jsx';
import TestResults from './pages/TestResult/TestResult.jsx';
import TeacherHomePage from './pages/TeacherHome/TeacherHome.jsx';
import TeacherTestResults from './pages/TestResultTeacher/TestResultTeacher.jsx';
import StudentHomePage from './pages/StudentHomePage/StudentHomePage.jsx';
import UpdateTest from './pages/UpdateTest/UpdateTest.jsx';
import UserProfile from './pages/UserProfile/UserProfile.jsx';
import TopNavbar from './pages/TopNavBar/TopNavbar.jsx';
import AdminHome from './pages/AdminHome/AdminHome.jsx';
import ManualEvaluation from './pages/ManualEvaluation/ManualEvaluation.jsx';
import ChatComponent from './pages/WebChat/WebChat.jsx';
import AIEvaluation from './pages/AiEvaluation/AiEvaluation.jsx';
import OtpVerify from './pages/Login/OtpVerify.jsx';

import RoleBasedRoute from './ProtectRoutes/ProtectRoute.jsx'; // <- Import the guard

function App() {
  return (
    <Router>
      <TopNavbar />
      <Toolbar />
      <Grid container>
        <Grid item xs={12}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/verify-otp" element={<OtpVerify />} />

            {/* ✅ Protected routes */}
            <Route
              path="/create-test"
              element={
                <RoleBasedRoute allowedRoles={['teacher']}>
                  <CreateTest />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/teacher-home"
              element={
                <RoleBasedRoute allowedRoles={['teacher']}>
                  <TeacherHomePage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/take-test"
              element={
                <RoleBasedRoute allowedRoles={['student']}>
                  <WriteTest />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/test-results"
              element={
                <RoleBasedRoute allowedRoles={['student']}>
                  <TestResults />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/student-home"
              element={
                <RoleBasedRoute allowedRoles={['student']}>
                  <StudentHomePage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/update-test"
              element={
                <RoleBasedRoute allowedRoles={['teacher']}>
                  <UpdateTest />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/test-results-teacher"
              element={
                <RoleBasedRoute allowedRoles={['teacher']}>
                  <TeacherTestResults />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <RoleBasedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <UserProfile />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/admin-home"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <AdminHome />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/manual-evaluation"
              element={
                <RoleBasedRoute allowedRoles={['teacher']}>
                  <ManualEvaluation />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/ems-integrated-chat"
              element={
                <RoleBasedRoute allowedRoles={['student', 'teacher']}>
                  <ChatComponent />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/ai-evaluation"
              element={
                <RoleBasedRoute allowedRoles={['teacher']}>
                  <AIEvaluation />
                </RoleBasedRoute>
              }
            />
          </Routes>
        </Grid>
      </Grid>
    </Router>
  );
}

export default App;
