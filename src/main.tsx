import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from "./App";
import LoginGuard from "./components/LoginGuard";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Help from "./pages/Help";
import Feedback from "./pages/Feedback";
import DirectList from "./components/direct/DirectList";
import DirectChatPanel from "./components/direct/DirectChatPanel";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import FriendRequests from "./pages/FriendRequests";
import { AuthProvider } from "./context/AuthContext";
import { SocialProvider } from "./context/SocialProvider";
import ProtectedRoute from "./components/ProtectedRoute";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      button={{ autoInsertSpace: false }}
      theme={{ algorithm: theme.darkAlgorithm }}
    >
      <AuthProvider>
        <BrowserRouter>
          <SocialProvider>
            <Routes>
              <Route path="/login" element={<LoginGuard />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                }
              >
                <Route index element={null} />
                <Route path="direct" element={<DirectList />} />
                <Route path="direct/:roomId" element={<DirectChatPanel />} />
                <Route path="rooms/:roomId" element={null} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="contacts/requests" element={<FriendRequests />} />
                <Route path="contacts/:userId" element={<ContactDetail />} />
              </Route>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/:userId"
                element={
                  <ProtectedRoute>
                    <UserProfile viewMode="other" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocialProvider>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  </StrictMode>,
);
