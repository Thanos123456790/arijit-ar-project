import { Navigate, useLocation } from "react-router-dom";

const RoleBasedRoute = ({ allowedRoles, children }) => {
    const location = useLocation();

    const sessionUser = JSON.parse(sessionStorage.getItem("currentUser"));

    if (!sessionUser) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(sessionUser.role)) {
        // Redirect to home if role not allowed
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleBasedRoute;
