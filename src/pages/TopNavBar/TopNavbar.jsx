import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Popover,
  Typography,
  Box,
  Button,
  Badge,
  Avatar,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";

const API      = import.meta.env.VITE_API_URL;
const CHAT_API = `${API}/chats`;
const USER_API = `${API}/users`;

export default function TopNavbar() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const cachedUser   = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const [user, setUser] = useState(cachedUser);

  useEffect(() => {
    if (!cachedUser?._id) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${USER_API}/${cachedUser._id}`);
        if (!res.ok) throw new Error("Fetch failed");
        const full = await res.json();
        sessionStorage.setItem("currentUser", JSON.stringify(full)); // keep in sync
        setUser(full);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [cachedUser?._id]);


  const [anchorEl, setAnchorEl] = useState(null);
  const popOpen = Boolean(anchorEl);
  const logout = () => {
    sessionStorage.clear();
    setAnchorEl(null);
    navigate("/");
  };


  const [unread, setUnread] = useState(0);
  const lastSeenKey = `chatLastSeen_${user?._id}`;

  useEffect(() => {
    if (!user?._id) return;
    const fetchUnread = async () => {
      const since   = localStorage.getItem(lastSeenKey) || "";
      const res     = await fetch(`${CHAT_API}?since=${since}`);
      const msgs    = await res.json();
      const unseen  = msgs.filter(m => m.senderId !== user._id).length;
      setUnread(unseen);
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 5000);
    return () => clearInterval(id);
  }, [user?._id, lastSeenKey]);



  if (location.pathname === "/") return null;


  const openChat = () => {
    localStorage.setItem(lastSeenKey, new Date().toISOString());
    setUnread(0);
    navigate("/ems-integrated-chat");
  };


  const avatarNode = user?.image ? (
    <Avatar src={user.image} sx={{ width: 32, height: 32 }} />
  ) : (
    <AccountCircleIcon sx={{ fontSize: 32 }} />
  );

  return (
    <>
      <AppBar
        position="fixed"
        color="primary"
        style={{
          zIndex: 1300,
          height: "55px",
          borderRadius: "10px",
        }}
      >
        <Toolbar sx={{ position: "relative", height: "55px", px: 2 }}>
          {/* Center-Aligned Title */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Exam Handling System
            </Typography>
          </Box>

          {/* Right-Aligned Icons */}
          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <IconButton
              onClick={openChat}
              sx={{ width: "50px" }}
              size="large"
              color="inherit"
            >
              <Badge badgeContent={unread} color="error">
                <MailIcon />
              </Badge>
            </IconButton>
            <IconButton size="large" sx={{width:"40px", height:"40px"}} color="inherit" onClick={e => setAnchorEl(e.currentTarget)}>
              {avatarNode}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Popover
        id={popOpen ? "user-pop" : undefined}
        open={popOpen}
        anchorEl={anchorEl}
        onClose={()=>setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle1">
            <strong>User Name:</strong> {user?.name}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {user?.email}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Role:</strong> {user?.role}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<CloseIcon />}
            onClick={logout}
          >
            Logout
          </Button>
          <br />
          <br />
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<AccountCircleIcon /> }
            onClick={()=>{ setAnchorEl(null); navigate("/profile"); }}
          >
            Manage Profile
          </Button>
        </Box>
      </Popover>
    </>
  );
};