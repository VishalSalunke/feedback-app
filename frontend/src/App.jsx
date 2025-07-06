import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateForm from './pages/forms/CreateForm';
import ViewForm from './pages/forms/ViewForm';
import FeedbackForm from './pages/public/FeedbackForm';
import FeedbackList from './pages/FeedbackList';
import FormsList from './pages/forms/FormsList';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 w-full">
          <div className="w-full">
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Public routes */}
              <Route path="/form/:id" element={<FeedbackForm />} />
              
              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/forms" element={<FormsList />} />
                <Route path="/forms/new" element={<CreateForm />} />
                <Route path="/forms/:id" element={<ViewForm />} />
                <Route path="/feedbacks" element={<FeedbackList />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
