
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LogoutComponent from './LogoutComponent'
import WelcomeComponent from './WelcomeComponent'
import ErrorComponent from './ErrorComponent'
import FooterComponent from './FooterComponent'
import LoginComponent from './LoginComponent'
import ExpenseComponent from './ExpenseComponent'
import AuthProvider, { useAuth } from './security/AuthContext'
import ListExpenseComponent from './ListExpenseComponent'
import HomePage from './HomePageComponent'
import AdminUserManagementPage from './AdminComponent'
import * as React from 'react';
import './ExpenseListApp.css'
import SignUp from './SignUpComponent'
import FinancialNewsComponent from './FinancialNewsComponent'
import Header from './NavBars'



function AuthenticatedRoute({ children }) {
    const authContext = useAuth()
    // If the isAuthenticated status is true after login, other component pages accessing will be allowed
    if (authContext.isAuthenticated) {
        return children
    } else {
        // Navigate to login page if the URL was mannually entered
        return <Navigate to="/" />
    }
}


export default function ExpenseListApp() {
    return (
        <div className="ExpenseListApp">
            <AuthProvider>
                <BrowserRouter>
                    {/* Header */}
                    <Header />
                    <Routes>
                        {/* Home page */}
                        <Route path='/' element={<HomePage />} />
                        {/* Login page */}
                        <Route path='/login' element={<LoginComponent />} />
                        {/* Register page */}
                        <Route path='/register' element={<SignUp />} />
                        {/* Welcome page */}
                        <Route path='/welcome/:username' element={
                            <AuthenticatedRoute>
                                <WelcomeComponent />
                            </AuthenticatedRoute>
                        } />
                        {/* User management page */}
                        <Route path='/admin' element={
                            <AuthenticatedRoute>
                                <AdminUserManagementPage />
                            </AuthenticatedRoute>
                        } />
                        {/*The list of expense details  page */}
                        <Route path='/details' element={
                            <AuthenticatedRoute>
                                <ListExpenseComponent />
                            </AuthenticatedRoute>
                        } />
                        {/* Financial news page */}
                        <Route path='/news' element={
                            <AuthenticatedRoute>
                                <FinancialNewsComponent />
                            </AuthenticatedRoute>
                        } />
                        {/* Logout page */}
                        <Route path='/logout' element={
                            <AuthenticatedRoute>
                                <LogoutComponent />
                            </AuthenticatedRoute>
                        } />
                        {/* Expense details page */}
                        <Route path='/expense/:id' element={
                            <AuthenticatedRoute>
                                <ExpenseComponent />
                            </AuthenticatedRoute>
                        } />
                        {/* Error page */}
                        <Route path='/*' element={<ErrorComponent />} />
                    </Routes>
                    {/* Footer */}
                    <FooterComponent />
                </BrowserRouter>
            </AuthProvider>

        </div>
    )
}















